const test = require('tap').test
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
const eventHandlers = require('./test-event-handlers')
const testName = 'db-review'

dbReviewTests()
function dbReviewTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(87)

      let processRestart = 0
      processStub.restart = function (q) {
        processRestart++
        t.ok(q.id, `Queue process restart called [${processRestart} of 2]`)
      }

      const q = new Queue(tOpts.cxn(), tOpts.master('dbReview', 1000))

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 0,
        progress: 0,
        pausing: 0,
        paused: 0,
        resumed: 0,
        removed: 0,
        idle: 0,
        reset: 0,
        error: 0,
        reviewed: 6,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 4,
        waiting: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
        terminated: 0,
        reanimated: 0,
        log: 0,
        updated: 0
      }

      function createRetryCount0Job () {
        let rc0Job = q.createJob()
        rc0Job.data = tData
        rc0Job.status = enums.status.active
        rc0Job.dateStarted = datetime.add.sec(new Date(), -400)
        rc0Job.retryCount = 0
        rc0Job.retryMax = 1
        return rc0Job
      }

      function createRetryCount1Job () {
        let rc1Job = q.createJob()
        rc1Job.data = tData
        rc1Job.status = enums.status.active
        rc1Job.dateStarted = datetime.add.sec(new Date(), -400)
        rc1Job.retryCount = 1
        rc1Job.retryMax = 1
        return rc1Job
      }
      function createCompletedJobPre () {
        let preJob = q.createJob()
        preJob.data = tData
        preJob.status = enums.status.completed
        preJob.dateStarted = datetime.add.days(new Date(), -179)
        preJob.dateFinished = datetime.add.days(new Date(), -179)
        return preJob
      }
      function createCompletedJobPost () {
        let postJob = q.createJob()
        postJob.data = tData
        postJob.status = enums.status.completed
        postJob.dateStarted = datetime.add.days(new Date(), -181)
        postJob.dateFinished = datetime.add.days(new Date(), -181)
        return postJob
      }
      function createCancelledJobPost () {
        let canJobPost = q.createJob()
        canJobPost.data = tData
        canJobPost.status = enums.status.terminated
        canJobPost.dateStarted = datetime.add.days(new Date(), -181)
        canJobPost.dateFinished = datetime.add.days(new Date(), -181)
        return canJobPost
      }
      function createTerminatedJobPost () {
        let termJobPost = q.createJob()
        termJobPost.data = tData
        termJobPost.status = enums.status.terminated
        termJobPost.dateStarted = datetime.add.days(new Date(), -181)
        termJobPost.dateFinished = datetime.add.days(new Date(), -181)
        return termJobPost
      }
      let retryCount0Job = createRetryCount0Job()
      let retryCount1Job = createRetryCount1Job()
      let completedJobPre = createCompletedJobPre()
      let completedJobPost = createCompletedJobPost()
      let cancelledJobPost = createCancelledJobPost()
      let terminatedJobPost = createTerminatedJobPost()

      return q.reset().then((removed) => {
        t.ok(is.integer(removed), 'Queue reset')
        return queueAddJob(q, [
          retryCount0Job,
          retryCount1Job,
          completedJobPre,
          completedJobPost,
          cancelledJobPost,
          terminatedJobPost
        ], true)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 6, 'Jobs saved successfully')
        t.equal(savedJobs[0].id, retryCount0Job.id, 'Job with retryCount 0 saved successfully')
        t.equal(savedJobs[1].id, retryCount1Job.id, 'Job with retryCount 1 saved successfully')
        t.equal(savedJobs[2].id, completedJobPre.id, 'Completed job pre-remove date saved successfully')
        t.equal(savedJobs[3].id, completedJobPost.id, 'Completed job post-remove date saved successfully')
        t.equal(savedJobs[4].id, cancelledJobPost.id, 'Cancelled job post-remove date saved successfully')
        t.equal(savedJobs[5].id, terminatedJobPost.id, 'Terminated job post-remove date saved successfully')
      }).then(() => {
        eventHandlers.add(t, q, state)

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

        //  ---------- removeFinishedJobs Tests ----------
        t.comment('db-review: removeFinishedJobs')
        completedJobPre = createCompletedJobPre()
        completedJobPost = createCompletedJobPost()
        cancelledJobPost = createCancelledJobPost()
        terminatedJobPost = createTerminatedJobPost()

        return queueAddJob(q, [
          completedJobPre,
          completedJobPost,
          cancelledJobPost,
          terminatedJobPost
        ], true)
      }).then((result) => {
        t.equal(result.length, 4, 'removeFinishedJobs test jobs added successfully')
        q._removeFinishedJobs = false
        t.notOk(q.removeFinishedJobs, 'removeFinishedJobs is false')
        return dbReview.runOnce(q)
      }).then((result) => {
        t.equal(result.reviewed, 0, 'Db review found no stalled jobs')
        t.equal(result.removed, 0, 'Db review did not remove any jobs')
        return q.getJob([
          completedJobPre,
          completedJobPost,
          cancelledJobPost,
          terminatedJobPost
        ])
      }).then((result) => {
        t.equal(result.length, 4, 'No jobs have been removed from the database')
        q._removeFinishedJobs = true
        t.ok(q.removeFinishedJobs, 'removeFinishedJobs is true')
        return dbReview.runOnce(q)
      }).then((result) => {
        t.equal(result.reviewed, 0, 'Db review found no stalled jobs')
        t.ok(result.removed > 4, 'Db review removed jobs')

        return q.getJob([
          completedJobPre,
          completedJobPost,
          cancelledJobPost,
          terminatedJobPost
        ])
      }).then((result) => {
        t.equal(result.length, 0, 'All review jobs have been deleted')

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

        eventHandlers.remove(t, q, state)
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
