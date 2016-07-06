const test = require('tape')
const Promise = require('bluebird')
const is = require('../src/is')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const moment = require('moment')
const enums = require('../src/enums')
// const dbReview = require('../src/db-review')
const queueAddJob = require('../src/queue-add-job')
const testData = require('./test-options').testData
const proxyquire = require('proxyquire')

const processStub = {}
const dbReview = proxyquire('../src/db-review',
  { './queue-process': processStub })

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-review test', (t) => {
      t.plan(42)

      processStub.restart = function (q) {
        t.ok(q.id, 'Queue process restart called')
      }

      let q = testQueue()
      let reviewCount = 0
      q.masterReviewPeriod = 1
      function reviewEventHandler (total) {
        reviewCount++
        t.pass(`Event: Database review [Review Count: ${reviewCount}]`)
        t.ok(is.integer(total), 'Review event return value is an Integer')
        if (reviewCount > 2) {
          t.ok(dbReview.isEnabled(), 'Review isEnabled reports true')
          dbReview.disable(q)
          t.notOk(dbReview.isEnabled(), 'Review isEnabled reports false')
          q.masterReviewPeriod = 300
          t.pass('Review timer completed twice')
          q.removeListener(enums.status.review, reviewEventHandler)
          // Test completes here!
          return q.reset().then((resetResult) => {
            t.ok(resetResult >= 0, 'Queue reset')
            resolve()
            return true
          })
        }
      }
      q.on(enums.status.review, reviewEventHandler)

      let job1 = q.createJob(testData)
      job1.status = enums.status.active
      job1.dateStarted = moment().add(-400, 'seconds').toDate()
      job1.retryCount = 0
      job1.retryMax = 1

      let job2 = q.createJob(testData)
      job2.status = enums.status.active
      job2.dateStarted = moment().add(-400, 'seconds').toDate()
      job2.retryCount = 1
      job2.retryMax = 1

      let jobs = [
        job1,
        job2
      ]

      return q.reset().then((deleted) => {
        t.ok(is.integer(deleted), 'Queue reset')
        return queueAddJob(q, jobs, true)
      }).then((savedJobs) => {
        t.equal(savedJobs[0].id, job1.id, 'Job 1 saved successfully')
        t.equal(savedJobs[1].id, job2.id, 'Job 2 saved successfully')
      }).then(() => {
        t.comment('db-review: runOnce')
        return dbReview.runOnce(q)
      }).then((reviewResult) => {
        t.ok(reviewResult >= 2, 'Job updated by db review')
        return q.getJob(job1.id)
      }).then((reviewedJob1) => {
        t.equal(reviewedJob1[0].status, enums.status.timeout, 'Reviewed job 1 is timeout status')
        t.equal(reviewedJob1[0].priority, 'retry', 'Reviewed job 1 is retry priority')
        t.ok(moment.isDate(reviewedJob1[0].dateTimeout), 'Reviewed job 1 dateTimeout is a date')
        t.ok(!reviewedJob1[0].dateFailed, 'Reviewed job 1 dateFailed is null')
        t.equal(reviewedJob1[0].retryCount, 1, 'Reviewed job 1 retryCount is 1')
        t.ok(moment.isDate(reviewedJob1[0].log[0].date), 'Log date is a date')
        t.equal(reviewedJob1[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(reviewedJob1[0].log[0].type, enums.log.warning, 'Log type is warning')
        t.equal(reviewedJob1[0].log[0].status, enums.status.timeout, 'Log status is timeout')
        t.ok(reviewedJob1[0].log[0].retryCount >= 0, 'Log retryCount is valid')
        t.ok(reviewedJob1[0].log[0].message, 'Log message is present')
        t.ok(!reviewedJob1[0].log[0].data, 'Log data is null')
        return q.getJob(job2.id)
      }).then((reviewedJob2) => {
        t.equal(reviewedJob2[0].status, enums.status.failed, 'Reviewed job 2 is failed status')
        t.equal(reviewedJob2[0].priority, 'normal', 'Reviewed job 2 is normal priority')
        t.ok(moment.isDate(reviewedJob2[0].dateTimeout), 'Reviewed job 2 dateTimeout is a date')
        t.ok(moment.isDate(reviewedJob2[0].dateFailed), 'Reviewed job 2 dateFailed is a date')
        t.equal(reviewedJob2[0].retryCount, 1, 'Reviewed job 2 retryCount is 1')
        t.ok(moment.isDate(reviewedJob2[0].log[0].date), 'Log date is a date')
        t.equal(reviewedJob2[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(reviewedJob2[0].log[0].type, enums.log.error, 'Log type is error')
        t.equal(reviewedJob2[0].log[0].status, enums.status.failed, 'Log status is failed')
        t.ok(reviewedJob2[0].log[0].retryCount >= 0, 'Log retryCount is valid')
        t.ok(moment.isDate(reviewedJob2[0].log[0].dateRetry), 'Log dateRetry is a date')
        t.ok(reviewedJob2[0].log[0].message, 'Log message is present')
        t.ok(!reviewedJob2[0].log[0].data, 'Log data is null')
        return dbReview.enable(q)
      }).catch(err => testError(err, module, t))
    })
  })
}
