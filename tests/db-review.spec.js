const test = require('tape')
const Promise = require('bluebird')
const is = require('../src/is')
const testError = require('./test-error')
const moment = require('moment')
const enums = require('../src/enums')
const queueAddJob = require('../src/queue-add-job')
const testData = require('./test-options').testData
const Queue = require('../src/queue')
const testOptions = require('./test-options')
const proxyquire = require('proxyquire').noCallThru()
const processStub = {}
const dbReview = proxyquire('../src/db-review',
  { './queue-process': processStub })

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-review', (t) => {
      t.plan(54)

      let processRestart = 0
      processStub.restart = function (q) {
        processRestart++
        t.ok(q.id, `Queue process restart called [${processRestart} of 2]`)
      }

      const q = new Queue(testOptions.master(1))
      let reviewCount = 0

      // ---------- Event Handler Setup ----------
      let testEvents = false
      function reviewedEventHandler (reviewResult) {
        reviewCount++
        if (testEvents) {
          t.pass(`Event: reviewed [Review Count: ${reviewCount}]`)
          t.ok(is.object(reviewResult), 'reviewed event returns an Object')
          t.ok(is.integer(reviewResult.reviewed), 'reviewed event returns reviewed as integer')
          t.ok(is.integer(reviewResult.removed), 'reviewed event returns removed as integer')
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.reviewed, reviewedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.reviewed, reviewedEventHandler)
      }

      let retryCount0Job = q.createJob().setPayload(testData)
      retryCount0Job.status = enums.status.active
      retryCount0Job.dateStarted = moment().add(-400, 'seconds').toDate()
      retryCount0Job.retryCount = 0
      retryCount0Job.retryMax = 1

      let retryCount1Job = q.createJob().setPayload(testData)
      retryCount1Job.status = enums.status.active
      retryCount1Job.dateStarted = moment().add(-400, 'seconds').toDate()
      retryCount1Job.retryCount = 1
      retryCount1Job.retryMax = 1

      let completedJobPre = q.createJob().setPayload(testData)
      completedJobPre.status = enums.status.completed
      completedJobPre.dateStarted = moment().add(-179, 'days').toDate()
      completedJobPre.dateFinished = moment().add(-179, 'days').toDate()

      let completedJobPost = q.createJob().setPayload(testData)
      completedJobPost.status = enums.status.completed
      completedJobPost.dateStarted = moment().add(-181, 'days').toDate()
      completedJobPost.dateFinished = moment().add(-181, 'days').toDate()

      let cancelledJobPost = q.createJob().setPayload(testData)
      cancelledJobPost.status = enums.status.terminated
      cancelledJobPost.dateStarted = moment().add(-181, 'days').toDate()
      cancelledJobPost.dateFinished = moment().add(-181, 'days').toDate()

      let terminatedJobPost = q.createJob().setPayload(testData)
      terminatedJobPost.status = enums.status.terminated
      terminatedJobPost.dateStarted = moment().add(-181, 'days').toDate()
      terminatedJobPost.dateFinished = moment().add(-181, 'days').toDate()

      let jobs = [
        retryCount0Job,
        retryCount1Job,
        completedJobPre,
        completedJobPost,
        cancelledJobPost,
        terminatedJobPost
      ]

      return q.reset().then((removed) => {
        t.ok(is.integer(removed), 'Queue reset')
        return queueAddJob(q, jobs, true)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 6, 'Jobs saved successfully')
        t.equal(savedJobs[0].id, retryCount0Job.id, 'Job with retryCount 0 saved successfully')
        t.equal(savedJobs[1].id, retryCount1Job.id, 'Job with retryCount 1 saved successfully')
        t.equal(savedJobs[2].id, completedJobPre.id, 'Completed job pre-remove date saved successfully')
        t.equal(savedJobs[3].id, completedJobPost.id, 'Completed job post-remove date saved successfully')
        t.equal(savedJobs[4].id, cancelledJobPost.id, 'Cancelled job post-remove date saved successfully')
        t.equal(savedJobs[5].id, terminatedJobPost.id, 'Terminated job post-remove date saved successfully')
      }).then(() => {
        addEventHandlers()

        //  ---------- runOnce Tests ----------
        t.comment('db-review: runOnce')
        return dbReview.runOnce(q)
      }).then((reviewResult) => {
        t.equal(reviewResult.reviewed, 2, 'Jobs updated by db review')
        t.equal(reviewResult.removed, 3, 'Jobs removed by db review')
        return q.getJob(retryCount0Job.id)
      }).then((reviewedRetryCount0Job) => {
        t.equal(reviewedRetryCount0Job[0].status, enums.status.failed, 'Reviewed job 1 is failed status')
        t.equal(reviewedRetryCount0Job[0].priority, 'retry', 'Reviewed job 1 is retry priority')
        t.ok(moment.isDate(reviewedRetryCount0Job[0].dateFinished), 'Reviewed job 1 dateFinished is a date')
        t.equal(reviewedRetryCount0Job[0].retryCount, 1, 'Reviewed job 1 retryCount is 1')
        t.ok(moment.isDate(reviewedRetryCount0Job[0].log[1].date), 'Log date is a date')
        t.equal(reviewedRetryCount0Job[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(reviewedRetryCount0Job[0].log[1].type, enums.log.warning, 'Log type is warning')
        t.equal(reviewedRetryCount0Job[0].log[1].status, enums.status.failed, 'Log status is failed')
        t.ok(reviewedRetryCount0Job[0].log[1].retryCount >= 0, 'Log retryCount is valid')
        t.ok(reviewedRetryCount0Job[0].log[1].message, 'Log message is present')
        t.ok(!reviewedRetryCount0Job[0].log[1].data, 'Log data is null')
        return q.getJob(retryCount1Job.id)
      }).then((reviewedRetryCount1Job) => {
        t.equal(reviewedRetryCount1Job[0].status, enums.status.terminated, 'Reviewed job 2 is terminated status')
        t.equal(reviewedRetryCount1Job[0].priority, 'normal', 'Reviewed job 2 is normal priority')
        t.ok(moment.isDate(reviewedRetryCount1Job[0].dateFinished), 'Reviewed job 2 dateFinished is a date')
        t.equal(reviewedRetryCount1Job[0].retryCount, 1, 'Reviewed job 2 retryCount is 1')
        t.ok(moment.isDate(reviewedRetryCount1Job[0].log[1].date), 'Log date is a date')
        t.equal(reviewedRetryCount1Job[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(reviewedRetryCount1Job[0].log[1].type, enums.log.error, 'Log type is error')
        t.equal(reviewedRetryCount1Job[0].log[1].status, enums.status.terminated, 'Log status is terminated')
        t.ok(reviewedRetryCount1Job[0].log[1].retryCount >= 0, 'Log retryCount is valid')
        t.ok(moment.isDate(reviewedRetryCount1Job[0].log[1].dateRetry), 'Log dateRetry is a date')
        t.ok(reviewedRetryCount1Job[0].log[1].message, 'Log message is present')
        t.ok(!reviewedRetryCount1Job[0].log[1].data, 'Log data is null')
        return q.getJob(completedJobPre.id)
      }).then((reviewedCompletedJobPre) => {
        t.equal(reviewedCompletedJobPre[0].id, completedJobPre.id, 'Completed job pre-remove date still exists')
        return q.getJob(completedJobPost.id)
      }).then((reviewedCompletedJobPost) => {
        t.equal(reviewedCompletedJobPost.length, 0, 'Completed job post-remove date deleted')
        return q.getJob(cancelledJobPost.id)
      }).then((reviewedCancelledJobPost) => {
        t.equal(reviewedCancelledJobPost.length, 0, 'Cancelled job post-remove date deleted')
        return q.getJob(terminatedJobPost.id)
      }).then((reviewedTerminatedJobPost) => {
        t.equal(reviewedTerminatedJobPost.length, 0, 'Terminated job post-remove date deleted')

        //  ---------- enable Tests ----------
        t.comment('db-review: enable')
        return dbReview.enable(q)
      }).delay(1500).then(() => {
        t.ok(dbReview.isEnabled(), 'Review isEnabled reports true')

        //  ---------- disable Tests ----------
        t.comment('db-review: disable')
        dbReview.disable(q)
        t.notOk(dbReview.isEnabled(), 'Review isEnabled reports false')

        removeEventHandlers()
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        return resolve(t.end())
      }).catch(err => testError(err, module, t))
    })
  })
}
