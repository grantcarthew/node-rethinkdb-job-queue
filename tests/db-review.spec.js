const test = require('tape')
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const datetime = require('../src/datetime')
const enums = require('../src/enums')
const queueAddJob = require('../src/queue-add-job')
const tData = require('./test-options').tData
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const proxyquire = require('proxyquire').noCallThru()
const processStub = {}
const dbReview = proxyquire('../src/db-review',
  { './queue-process': processStub })

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-review', (t) => {
      t.plan(55)

      let processRestart = 0
      processStub.restart = function (q) {
        processRestart++
        t.ok(q.id, `Queue process restart called [${processRestart} of 2]`)
      }

      const q = new Queue(tOpts.cxn(), tOpts.master(1000))
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

      let retryCount0Job = q.createJob()
      retryCount0Job.data = tData
      retryCount0Job.status = enums.status.active
      retryCount0Job.dateStarted = datetime.add.sec(new Date(), -400)
      retryCount0Job.retryCount = 0
      retryCount0Job.retryMax = 1

      let retryCount1Job = q.createJob()
      retryCount1Job.data = tData
      retryCount1Job.status = enums.status.active
      retryCount1Job.dateStarted = datetime.add.sec(new Date(), -400)
      retryCount1Job.retryCount = 1
      retryCount1Job.retryMax = 1

      let completedJobPre = q.createJob()
      completedJobPre.data = tData
      completedJobPre.status = enums.status.completed
      completedJobPre.dateStarted = datetime.add.days(new Date(), -179)
      completedJobPre.dateFinished = datetime.add.days(new Date(), -179)

      let completedJobPost = q.createJob()
      completedJobPost.data = tData
      completedJobPost.status = enums.status.completed
      completedJobPost.dateStarted = datetime.add.days(new Date(), -181)
      completedJobPost.dateFinished = datetime.add.days(new Date(), -181)

      let cancelledJobPost = q.createJob()
      cancelledJobPost.data = tData
      cancelledJobPost.status = enums.status.terminated
      cancelledJobPost.dateStarted = datetime.add.days(new Date(), -181)
      cancelledJobPost.dateFinished = datetime.add.days(new Date(), -181)

      let terminatedJobPost = q.createJob()
      terminatedJobPost.data = tData
      terminatedJobPost.status = enums.status.terminated
      terminatedJobPost.dateStarted = datetime.add.days(new Date(), -181)
      terminatedJobPost.dateFinished = datetime.add.days(new Date(), -181)

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
        t.equal(reviewedRetryCount0Job[0].priority, 'normal', 'Reviewed job 1 is normal priority')
        t.ok(is.date(reviewedRetryCount0Job[0].dateFinished), 'Reviewed job 1 dateFinished is a date')
        t.equal(reviewedRetryCount0Job[0].retryCount, 1, 'Reviewed job 1 retryCount is 1')
        t.ok(is.date(reviewedRetryCount0Job[0].log[1].date), 'Log date is a date')
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
        t.ok(is.date(reviewedRetryCount1Job[0].dateFinished), 'Reviewed job 2 dateFinished is a date')
        t.equal(reviewedRetryCount1Job[0].retryCount, 1, 'Reviewed job 2 retryCount is 1')
        t.ok(is.date(reviewedRetryCount1Job[0].log[1].date), 'Log date is a date')
        t.equal(reviewedRetryCount1Job[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(reviewedRetryCount1Job[0].log[1].type, enums.log.error, 'Log type is error')
        t.equal(reviewedRetryCount1Job[0].log[1].status, enums.status.terminated, 'Log status is terminated')
        t.ok(reviewedRetryCount1Job[0].log[1].retryCount >= 0, 'Log retryCount is valid')
        t.ok(is.date(reviewedRetryCount1Job[0].log[1].dateEnable), 'Log dateEnable is a date')
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
        t.ok(dbReview.isEnabled(q), 'Review isEnabled reports true')
        return q.findJob({ state: enums.status.reviewed }, true)
      }).then((stateDoc) => {
        t.equal(stateDoc[0].state, enums.status.reviewed, 'State document is at reviewed state')

        //  ---------- disable Tests ----------
        t.comment('db-review: disable')
        dbReview.disable(q)
        t.notOk(dbReview.isEnabled(q), 'Review isEnabled reports false')

        removeEventHandlers()
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
