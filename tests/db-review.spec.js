const test = require('tape')
const Promise = require('bluebird')
const is = require('is')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const moment = require('moment')
const enums = require('../src/enums')
const dbReview = require('../src/db-review')
const queueAddJob = require('../src/queue-add-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-review test', (t) => {
      t.plan(39)

      let q = testQueue()
      let reviewCount = 0
      q.masterReviewPeriod = 1
      function reviewEventHandler (total) {
        reviewCount++
        t.pass(`Event: Database review [Review Count: ${reviewCount}]`)
        t.ok(is.integer(total), 'Review event return value is an Integer')
        if (reviewCount > 2) {
          t.ok(dbReview.isEnabled(), 'Review isEnabled reports true')
          dbReview.run(q, enums.reviewRun.disable)
          t.notOk(dbReview.isEnabled(), 'Review isEnabled reports false')
          q.masterReviewPeriod = 300
          t.pass('Review timer completed twice')
          q.removeListener(enums.queueStatus.review, reviewEventHandler)
          // Test completes here!
          return q.reset().then((resetResult) => {
            t.ok(resetResult >= 0, 'Queue reset')
            resolve()
            return true
          })
        }
      }
      function reviewEnabledEventHandler () {
        t.pass('Event: Review enabled')
        q.removeListener(enums.queueStatus.reviewEnabled, reviewEnabledEventHandler)
      }
      function reviewDisabledEventHandler () {
        t.pass('Event: Review disabled')
        q.removeListener(enums.queueStatus.reviewDisabled, reviewDisabledEventHandler)
      }
      q.on(enums.queueStatus.reviewEnabled, reviewEnabledEventHandler)
      q.on(enums.queueStatus.reviewDisabled, reviewDisabledEventHandler)
      q.on(enums.queueStatus.review, reviewEventHandler)

      let job1 = q.createJob(testData)
      job1.status = enums.jobStatus.active
      job1.dateStarted = moment().add(-400, 'seconds').toDate()
      job1.retryCount = 0
      job1.retryMax = 1

      let job2 = q.createJob(testData)
      job2.status = enums.jobStatus.active
      job2.dateStarted = moment().add(-400, 'seconds').toDate()
      job2.retryCount = 1
      job2.retryMax = 1

      let jobs = [
        job1,
        job2
      ]

      return queueAddJob(q, jobs, true).then((savedJobs) => {
        t.equal(savedJobs[0].id, job1.id, 'Job 1 saved successfully')
        t.equal(savedJobs[1].id, job2.id, 'Job 2 saved successfully')
      }).then(() => {
        return dbReview.run(q, enums.reviewRun.once)
      }).then((reviewResult) => {
        t.ok(reviewResult >= 2, 'Job updated by db review')
        return q.getJob(job1.id)
      }).then((reviewedJob1) => {
        t.equal(reviewedJob1[0].status, enums.jobStatus.timeout, 'Reviewed job 1 is timeout status')
        t.equal(reviewedJob1[0].priority, 'retry', 'Reviewed job 1 is retry priority')
        t.ok(moment.isDate(reviewedJob1[0].dateTimeout), 'Reviewed job 1 dateTimeout is a date')
        t.ok(!reviewedJob1[0].dateFailed, 'Reviewed job 1 dateFailed is null')
        t.equal(reviewedJob1[0].retryCount, 1, 'Reviewed job 1 retryCount is 1')
        t.ok(moment.isDate(reviewedJob1[0].log[0].date), 'Log date is a date')
        t.equal(reviewedJob1[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(reviewedJob1[0].log[0].type, enums.log.warning, 'Log type is warning')
        t.equal(reviewedJob1[0].log[0].status, enums.jobStatus.timeout, 'Log status is timeout')
        t.ok(reviewedJob1[0].log[0].message, 'Log message is present')
        t.ok(reviewedJob1[0].log[0].duration >= 0, 'Log duration is >= 0')
        t.ok(!reviewedJob1[0].log[0].data, 'Log data is null')
        return q.getJob(job2.id)
      }).then((reviewedJob2) => {
        t.equal(reviewedJob2[0].status, enums.jobStatus.failed, 'Reviewed job 2 is failed status')
        t.equal(reviewedJob2[0].priority, 'normal', 'Reviewed job 2 is normal priority')
        t.ok(moment.isDate(reviewedJob2[0].dateTimeout), 'Reviewed job 2 dateTimeout is a date')
        t.ok(moment.isDate(reviewedJob2[0].dateFailed), 'Reviewed job 2 dateFailed is a date')
        t.equal(reviewedJob2[0].retryCount, 1, 'Reviewed job 2 retryCount is 1')
        t.ok(moment.isDate(reviewedJob2[0].log[0].date), 'Log date is a date')
        t.equal(reviewedJob2[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(reviewedJob2[0].log[0].type, enums.log.error, 'Log type is error')
        t.equal(reviewedJob2[0].log[0].status, enums.jobStatus.failed, 'Log status is failed')
        t.ok(reviewedJob2[0].log[0].message, 'Log message is present')
        t.ok(reviewedJob2[0].log[0].duration >= 0, 'Log duration is >= 0')
        t.ok(!reviewedJob2[0].log[0].data, 'Log data is null')
        return dbReview.run(q, enums.reviewRun.enable)
      }).catch(err => testError(err, module, t))
    })
  })
}
