const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const enums = require('../src/enums')
const jobFailed = require('../src/job-failed')
const testData = require('./test-options').testData
const Queue = require('../src/queue')
const testOptions = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job-failed', (t) => {
      t.plan(79)

      const q = new Queue(testOptions.queueDefault())

      // ---------- Event Handler Setup ----------
      let testEvents = false
      function failedEventHandler (jobId, dateRetry) {
        if (testEvents) {
          t.equal(jobId, job.id,
            `Event: Job failed [${jobId}]`)
          t.ok(is.date(dateRetry),
            `Event: Job failed dateRetry is a date [${dateRetry}]`)
        }
      }
      function terminatedEventHandler (jobId) {
        if (testEvents) {
          t.equal(jobId, job.id,
            `Event: Job terminated [${jobId}]`)
        }
      }
      function removedEventHandler (jobId) {
        if (testEvents) {
          t.equal(jobId, job.id,
            `Event: Job removed [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.failed, failedEventHandler)
        q.on(enums.status.terminated, terminatedEventHandler)
        q.on(enums.status.removed, removedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.failed, failedEventHandler)
        q.removeListener(enums.status.terminated, terminatedEventHandler)
        q.removeListener(enums.status.removed, removedEventHandler)
      }

      let job = q.createJob(testData)
      const err = new Error('Test error from job-failed tests')

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')

        // ---------- Job Failed Retry 0 Test ----------
        addEventHandlers()
        t.comment('job-failed: Original Job Failure')
        return jobFailed(err, savedJob[0], testData)
      }).then((retry1id) => {
        t.equal(retry1id.length, 1, 'Job failed successfully')
        t.equal(retry1id[0], job.id, 'Job failed returned job id')
        return q.getJob(retry1id[0])
      }).then((retry1) => {
        t.equal(retry1[0].status, enums.status.failed, 'Job status is failed')
        t.equal(retry1[0].retryCount, 1, 'Job retryCount is 1')
        t.equal(retry1[0].progress, 0, 'Job progress is 0')
        t.equal(retry1[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(retry1[0].dateFinished), 'Job dateFinished is a date')
        t.equal(retry1[0].log.length, 2, 'Job has 1 log entry')
        t.ok(moment.isDate(retry1[0].log[1].date), 'Log date is a date')
        t.equal(retry1[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(retry1[0].log[1].type, enums.log.warning, 'Log type is warning')
        t.equal(retry1[0].log[1].status, enums.status.failed, 'Log status is failed')
        t.ok(retry1[0].log[1].retryCount = 1, 'Log retryCount is valid')
        t.ok(retry1[0].log[1].message, 'Log message exists')
        t.ok(retry1[0].log[1].duration >= 0, 'Log duration is >= 0')
        t.equal(retry1[0].log[1].data, job.data, 'Log data is valid')

        // ---------- Job Failed Retry 1 Test ----------
        t.comment('job-failed: First Retry Job Failure')
        return jobFailed(err, retry1[0], testData)
      }).then((retry2id) => {
        t.equal(retry2id.length, 1, 'Job failed successfully')
        t.equal(retry2id[0], job.id, 'Job failed returned job id')
        return q.getJob(retry2id[0])
      }).then((retry2) => {
        t.equal(retry2[0].retryCount, 2, 'Job retryCount is 2')
        t.equal(retry2[0].progress, 0, 'Job progress is 0')
        t.equal(retry2[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(retry2[0].dateFinished), 'Job dateFinished is a date')
        t.equal(retry2[0].log.length, 3, 'Job has 2 log entries')
        t.ok(moment.isDate(retry2[0].log[2].date), 'Log date is a date')
        t.equal(retry2[0].log[2].queueId, q.id, 'Log queueId is valid')
        t.equal(retry2[0].log[2].type, enums.log.warning, 'Log type is warning')
        t.equal(retry2[0].log[2].status, enums.status.failed, 'Log status is failed')
        t.ok(retry2[0].log[2].retryCount = 2, 'Log retryCount is valid')
        t.ok(retry2[0].log[2].message, 'Log message exists')
        t.ok(retry2[0].log[2].duration >= 0, 'Log duration is >= 0')
        t.equal(retry2[0].log[2].data, job.data, 'Log data is valid')

        // ---------- Job Failed Retry 2 Test ----------
        t.comment('job-failed: Second Retry Job Failure')
        return jobFailed(err, retry2[0], testData)
      }).then((retry3id) => {
        t.equal(retry3id.length, 1, 'Job failed successfully')
        t.equal(retry3id[0], job.id, 'Job failed returned job id')
        return q.getJob(retry3id[0])
      }).then((retry3) => {
        t.equal(retry3[0].status, enums.status.failed, 'Job status is failed')
        t.equal(retry3[0].retryCount, 3, 'Job retryCount is 3')
        t.equal(retry3[0].progress, 0, 'Job progress is 0')
        t.equal(retry3[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(retry3[0].dateFinished), 'Job dateFinished is a date')
        t.equal(retry3[0].log.length, 4, 'Job has 3 log entries')
        t.ok(moment.isDate(retry3[0].log[3].date), 'Log date is a date')
        t.equal(retry3[0].log[3].queueId, q.id, 'Log queueId is valid')
        t.equal(retry3[0].log[3].type, enums.log.warning, 'Log type is warning')
        t.equal(retry3[0].log[3].status, enums.status.failed, 'Log status is failed')
        t.ok(retry3[0].log[3].retryCount = 3, 'Log retryCount is valid')
        t.ok(retry3[0].log[3].message, 'Log message exists')
        t.ok(retry3[0].log[3].duration >= 0, 'Log duration is >= 0')
        t.equal(retry3[0].log[3].data, job.data, 'Log data is valid')

        // ---------- Job Failed Retry 3 Test ----------
        t.comment('job-failed: Third and Final Retry Job Failure')
        return jobFailed(err, retry3[0], testData)
      }).then((failedId) => {
        t.equal(failedId.length, 1, 'Job failed successfully')
        t.equal(failedId[0], job.id, 'Job failed returned job id')
        return q.getJob(failedId[0])
      }).then((failed) => {
        t.equal(failed[0].status, enums.status.terminated, 'Job status is terminated')
        t.equal(failed[0].retryCount, 3, 'Job retryCount is 3')
        t.equal(failed[0].progress, 0, 'Job progress is 0')
        t.equal(failed[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(failed[0].dateFinished), 'Job dateFinished is a date')
        t.equal(failed[0].log.length, 5, 'Job has 4 log entries')
        t.ok(moment.isDate(failed[0].log[4].date), 'Log date is a date')
        t.equal(failed[0].log[4].queueId, q.id, 'Log queueId is valid')
        t.equal(failed[0].log[4].type, enums.log.error, 'Log type is error')
        t.equal(failed[0].log[4].status, enums.status.terminated, 'Log status is terminated')
        t.ok(failed[0].log[4].retryCount = 3, 'Log retryCount is valid')
        t.ok(failed[0].log[4].message, 'Log message exists')
        t.ok(failed[0].log[4].duration >= 0, 'Log duration is >= 0')
        t.equal(failed[0].log[4].data, job.data, 'Log data is valid')

        // ---------- Job Failed with Remove Finished Jobs Test ----------
        t.comment('job-failed: Job Terminated with Remove Finished Jobs')
        job = q.createJob(testData)
        job.retryMax = 0
        q._removeFinishedJobs = true
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return jobFailed(err, savedJob[0], testData)
      }).then((removeResult) => {
        t.equal(removeResult.length, 1, 'Job failed successfully')
        t.equal(removeResult[0], job.id, 'Job failed returned job id')
        return q.getJob(job.id)
      }).then((exist) => {
        t.equal(exist.length, 0, 'Job not in database')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        removeEventHandlers()
        q.stop()
        return resolve(t.end())
      }).catch(err => testError(err, module, t))
    })
  })
}
