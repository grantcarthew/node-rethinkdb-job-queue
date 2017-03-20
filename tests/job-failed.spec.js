const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const jobFailed = require('../src/job-failed')
const tData = require('./test-options').tData
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'job-failed'

jobFailedTests()
function jobFailedTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(160)

      const q = new Queue(tOpts.cxn(), tOpts.default('jobFailed'))

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
        removed: 1,
        reset: 1,
        error: 0,
        reviewed: 0,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 2,
        waiting: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        failed: 6,
        terminated: 2,
        reanimated: 0,
        log: 0,
        updated: 0
      }

      let job = q.createJob()
      job.data = tData
      const err = new Error('Test error from job-failed tests')

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')

        // ---------- Job Failed Retry 0 Test ----------
        eventHandlers.add(t, q, state)
        t.comment('job-failed: Original Job Failure')
        return jobFailed(savedJob[0], err)
      }).then((retry1id) => {
        t.equal(retry1id.length, 1, 'Job failed successfully')
        t.equal(retry1id[0], job.id, 'Job failed returned job id')
        return q.getJob(retry1id[0])
      }).then((retry1) => {
        t.equal(retry1[0].status, enums.status.failed, 'Job status is failed')
        t.equal(retry1[0].retryCount, 1, 'Job retryCount is 1')
        t.equal(retry1[0].progress, 0, 'Job progress is 0')
        t.equal(retry1[0].queueId, q.id, 'Job queueId is valid')
        t.ok(is.date(retry1[0].dateFinished), 'Job dateFinished is a date')
        t.ok(is.date(retry1[0].dateEnable), 'Job dateEnable is a date')
        t.equal(retry1[0].log.length, 2, 'Job has 1 log entry')
        t.ok(is.date(retry1[0].log[1].date), 'Log date is a date')
        t.equal(retry1[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(retry1[0].log[1].type, enums.log.warning, 'Log type is warning')
        t.equal(retry1[0].log[1].status, enums.status.failed, 'Log status is failed')
        t.ok(retry1[0].log[1].retryCount = 1, 'Log retryCount is valid')
        t.ok(retry1[0].log[1].message, 'Log message exists')
        t.equal(retry1[0].log[1].message, enums.message.failed, 'Log message is valid')
        t.equal(retry1[0].log[1].errorMessage, err.message, 'Log error message is valid')
        t.equal(retry1[0].log[1].errorStack, err.stack, 'Log stack is valid')
        t.ok(retry1[0].log[1].duration >= 0, 'Log duration is >= 0')

        // ---------- Job Failed Retry 1 Test ----------
        t.comment('job-failed: First Retry Job Failure')
        return jobFailed(retry1[0], err)
      }).then((retry2id) => {
        t.equal(retry2id.length, 1, 'Job failed successfully')
        t.equal(retry2id[0], job.id, 'Job failed returned job id')
        return q.getJob(retry2id[0])
      }).then((retry2) => {
        t.equal(retry2[0].retryCount, 2, 'Job retryCount is 2')
        t.equal(retry2[0].progress, 0, 'Job progress is 0')
        t.equal(retry2[0].queueId, q.id, 'Job queueId is valid')
        t.ok(is.date(retry2[0].dateFinished), 'Job dateFinished is a date')
        t.ok(is.date(retry2[0].dateEnable), 'Job dateEnable is a date')
        t.equal(retry2[0].log.length, 3, 'Job has 2 log entries')
        t.ok(is.date(retry2[0].log[2].date), 'Log date is a date')
        t.equal(retry2[0].log[2].queueId, q.id, 'Log queueId is valid')
        t.equal(retry2[0].log[2].type, enums.log.warning, 'Log type is warning')
        t.equal(retry2[0].log[2].status, enums.status.failed, 'Log status is failed')
        t.ok(retry2[0].log[2].retryCount = 2, 'Log retryCount is valid')
        t.ok(retry2[0].log[2].message, 'Log message exists')
        t.equal(retry2[0].log[2].message, enums.message.failed, 'Log message is valid')
        t.equal(retry2[0].log[2].errorMessage, err.message, 'Log error message is valid')
        t.equal(retry2[0].log[2].errorStack, err.stack, 'Log stack is valid')
        t.ok(retry2[0].log[2].duration >= 0, 'Log duration is >= 0')

        // ---------- Job Failed Retry 2 Test ----------
        t.comment('job-failed: Second Retry Job Failure')
        return jobFailed(retry2[0], err)
      }).then((retry3id) => {
        t.equal(retry3id.length, 1, 'Job failed successfully')
        t.equal(retry3id[0], job.id, 'Job failed returned job id')
        return q.getJob(retry3id[0])
      }).then((retry3) => {
        t.equal(retry3[0].status, enums.status.failed, 'Job status is failed')
        t.equal(retry3[0].retryCount, 3, 'Job retryCount is 3')
        t.equal(retry3[0].progress, 0, 'Job progress is 0')
        t.equal(retry3[0].queueId, q.id, 'Job queueId is valid')
        t.ok(is.date(retry3[0].dateFinished), 'Job dateFinished is a date')
        t.ok(is.date(retry3[0].dateEnable), 'Job dateEnable is a date')
        t.equal(retry3[0].log.length, 4, 'Job has 3 log entries')
        t.ok(is.date(retry3[0].log[3].date), 'Log date is a date')
        t.equal(retry3[0].log[3].queueId, q.id, 'Log queueId is valid')
        t.equal(retry3[0].log[3].type, enums.log.warning, 'Log type is warning')
        t.equal(retry3[0].log[3].status, enums.status.failed, 'Log status is failed')
        t.ok(retry3[0].log[3].retryCount = 3, 'Log retryCount is valid')
        t.ok(retry3[0].log[3].message, 'Log message exists')
        t.equal(retry3[0].log[3].message, enums.message.failed, 'Log message is valid')
        t.equal(retry3[0].log[3].errorMessage, err.message, 'Log error message is valid')
        t.equal(retry3[0].log[3].errorStack, err.stack, 'Log stack is valid')
        t.ok(retry3[0].log[3].duration >= 0, 'Log duration is >= 0')

        // ---------- Job Failed Retry 3 Test ----------
        t.comment('job-failed: Third and Final Retry Job Failure')
        return jobFailed(retry3[0], err)
      }).then((failedId) => {
        t.equal(failedId.length, 1, 'Job failed successfully')
        t.equal(failedId[0], job.id, 'Job failed returned job id')
        return q.getJob(failedId[0])
      }).then((failed) => {
        t.equal(failed[0].status, enums.status.terminated, 'Job status is terminated')
        t.equal(failed[0].retryCount, 3, 'Job retryCount is 3')
        t.equal(failed[0].progress, 0, 'Job progress is 0')
        t.equal(failed[0].queueId, q.id, 'Job queueId is valid')
        t.ok(is.date(failed[0].dateFinished), 'Job dateFinished is a date')
        t.ok(is.date(failed[0].dateEnable), 'Job dateEnable is a date')
        t.equal(failed[0].log.length, 5, 'Job has 4 log entries')
        t.ok(is.date(failed[0].log[4].date), 'Log date is a date')
        t.equal(failed[0].log[4].queueId, q.id, 'Log queueId is valid')
        t.equal(failed[0].log[4].type, enums.log.error, 'Log type is error')
        t.equal(failed[0].log[4].status, enums.status.terminated, 'Log status is terminated')
        t.ok(failed[0].log[4].retryCount = 3, 'Log retryCount is valid')
        t.ok(failed[0].log[4].message, 'Log message exists')
        t.equal(failed[0].log[4].message, enums.message.failed, 'Log message is valid')
        t.equal(failed[0].log[4].errorMessage, err.message, 'Log error message is valid')
        t.equal(failed[0].log[4].errorStack, err.stack, 'Log stack is valid')
        t.ok(failed[0].log[4].duration >= 0, 'Log duration is >= 0')

        // ---------- Job Failed with Remove Finished Jobs Test ----------
        t.comment('job-failed: Job Terminated with Remove Finished Jobs')
        job = q.createJob()
        job.data = tData
        job.retryMax = 0
        q._removeFinishedJobs = true
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return jobFailed(savedJob[0], err)
      }).then((removeResult) => {
        t.equal(removeResult.length, 1, 'Job failed successfully')
        t.equal(removeResult[0], job.id, 'Job failed returned job id')
        return q.getJob(job.id)
      }).then((exist) => {
        t.equal(exist.length, 0, 'Job not in database')

        // ---------- Job Failed with Repeat Test ----------
        t.comment('job-failed: Job Failed with Repeat')
        job = q.createJob()
        job.data = tData
        job.retryMax = 1
        job.retryDelay = 200
        job.repeat = 1
        job.repeatDelay = 500
        q._removeFinishedJobs = false
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return jobFailed(savedJob[0], err)
      }).then((retry1id) => {
        t.equal(retry1id.length, 1, 'Job failed successfully')
        t.equal(retry1id[0], job.id, 'Job failed returned job id')
        return q.getJob(retry1id[0])
      }).then((retry1) => {
        t.equal(retry1[0].status, enums.status.failed, 'Job status is failed')
        t.equal(retry1[0].retryCount, 1, 'Job retryCount is 1')
        t.equal(retry1[0].progress, 0, 'Job progress is 0')
        t.equal(retry1[0].queueId, q.id, 'Job queueId is valid')
        t.ok(is.date(retry1[0].dateFinished), 'Job dateFinished is a date')
        t.ok(is.date(retry1[0].dateEnable), 'Job dateEnable is a date')
        t.equal(retry1[0].log.length, 2, 'Job has 1 log entry')
        t.ok(is.date(retry1[0].log[1].date), 'Log date is a date')
        t.equal(retry1[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(retry1[0].log[1].type, enums.log.warning, 'Log type is warning')
        t.equal(retry1[0].log[1].status, enums.status.failed, 'Log status is failed')
        t.ok(retry1[0].log[1].retryCount = 1, 'Log retryCount is valid')
        t.ok(retry1[0].log[1].message, 'Log message exists')
        t.equal(retry1[0].log[1].message, enums.message.failed, 'Log message is valid')
        t.equal(retry1[0].log[1].errorMessage, err.message, 'Log error message is valid')
        t.equal(retry1[0].log[1].errorStack, err.stack, 'Log stack is valid')
        t.ok(retry1[0].log[1].duration >= 0, 'Log duration is >= 0')

        // ---------- Final Retry Job Repeat Failure Test ----------
        t.comment('job-failed: Final Retry Job Repeat Failure')
        return jobFailed(retry1[0], err)
      }).then((retry2id) => {
        t.equal(retry2id.length, 1, 'Job failed successfully')
        t.equal(retry2id[0], job.id, 'Job failed returned job id')
        return q.getJob(retry2id[0])
      }).then((retry2) => {
        t.equal(retry2[0].status, enums.status.waiting, 'Job status is waiting')
        t.equal(retry2[0].retryCount, 0, 'Job retryCount is 0')
        t.equal(retry2[0].progress, 0, 'Job progress is 0')
        t.equal(retry2[0].queueId, q.id, 'Job queueId is valid')
        t.ok(is.date(retry2[0].dateFinished), 'Job dateFinished is a date')
        t.ok(is.date(retry2[0].dateEnable), 'Job dateEnable is a date')
        t.equal(retry2[0].log.length, 3, 'Job has 2 log entries')
        t.ok(is.date(retry2[0].log[2].date), 'Log date is a date')
        t.equal(retry2[0].log[2].queueId, q.id, 'Log queueId is valid')
        t.equal(retry2[0].log[2].type, enums.log.error, 'Log type is error')
        t.equal(retry2[0].log[2].status, enums.status.waiting, 'Log status is waiting')
        t.ok(retry2[0].log[2].retryCount = 2, 'Log retryCount is valid')
        t.ok(retry2[0].log[2].message, 'Log message exists')
        t.equal(retry2[0].log[2].message, enums.message.failed, 'Log message is valid')
        t.equal(retry2[0].log[2].errorMessage, err.message, 'Log error message is valid')
        t.equal(retry2[0].log[2].errorStack, err.stack, 'Log stack is valid')
        t.ok(retry2[0].log[2].duration >= 0, 'Log duration is >= 0')

        // ---------- Job Repeat Failure Log Limit Test ----------
        t.comment('job-failed: Job Repeat Failure Log Limit')
        job.q._limitJobLogs = 2
        t.equal(retry2[0].log.length, 3, 'Job has 3 log entries prior to log limiting')
        return jobFailed(retry2[0], err)
      }).then((limitLogsIds) => {
        t.ok(is.uuid(limitLogsIds[0]), 'Job completed returns uuid')
        return q.getJob(limitLogsIds[0])
      }).then((limitLogsJobs) => {
        t.equal(limitLogsJobs[0].log.length, 2, 'Job has 2 log entries after log limiting')
        // have to loop through the logs because the timestamp is the same
        // for the completed and truncated entries. Job.getLastLog() is indeterminate
        let logValid = false
        function setLogValid () { logValid = true }
        for (let log of limitLogsJobs[0].log) {
          log.message === enums.message.jobLogsTruncated && setLogValid()
        }
        t.ok(logValid, 'Job has logs truncated log entry')

        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
