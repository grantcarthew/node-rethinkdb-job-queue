const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const jobFailed = require('../src/job-failed')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job-failed', (t) => {
      t.plan(62)

      const q = testQueue()
      const job = q.createJob(testData)
      const err = new Error('Test error from job-failed tests')
      let failedEventCount = 0
      q.on(enums.status.failed, function failed (jobId) {
        failedEventCount++
        t.equal(jobId, job.id, `Event: Job failed [${failedEventCount}]`)
        if (failedEventCount >= 3) {
          q.removeListener(enums.status.failed, failed)
        }
      })

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')

        // ---------- Job Failed Retry 0 Test ----------
        t.comment('job-failed: Original Job Failure')
        return jobFailed(err, savedJob[0], testData)
      }).then((retry1) => {
        t.equal(retry1[0].status, enums.status.retry, 'Job status is retry')
        t.equal(retry1[0].retryCount, 1, 'Job retryCount is 1')
        t.equal(retry1[0].progress, 0, 'Job progress is 0')
        t.equal(retry1[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(retry1[0].dateFailed), 'Job dateFailed is a date')
        t.equal(retry1[0].log.length, 1, 'Job has 1 log entry')
        t.ok(moment.isDate(retry1[0].log[0].date), 'Log date is a date')
        t.equal(retry1[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(retry1[0].log[0].type, enums.log.warning, 'Log type is warning')
        t.equal(retry1[0].log[0].status, enums.status.retry, 'Log status is retry')
        t.ok(retry1[0].log[0].retryCount = 1, 'Log retryCount is valid')
        t.ok(retry1[0].log[0].message, 'Log message exists')
        t.ok(retry1[0].log[0].duration >= 0, 'Log duration is >= 0')
        t.equal(retry1[0].log[0].data, job.data, 'Log data is valid')

        // ---------- Job Failed Retry 1 Test ----------
        t.comment('job-failed: First Retry Job Failure')
        return jobFailed(err, retry1[0], testData)
      }).then((retry2) => {
        t.equal(retry2[0].status, enums.status.retry, 'Job status is retry')
        t.equal(retry2[0].retryCount, 2, 'Job retryCount is 2')
        t.equal(retry2[0].progress, 0, 'Job progress is 0')
        t.equal(retry2[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(retry2[0].dateFailed), 'Job dateFailed is a date')
        t.equal(retry2[0].log.length, 2, 'Job has 2 log entries')
        t.ok(moment.isDate(retry2[0].log[1].date), 'Log date is a date')
        t.equal(retry2[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(retry2[0].log[1].type, enums.log.warning, 'Log type is warning')
        t.equal(retry2[0].log[1].status, enums.status.retry, 'Log status is retry')
        t.ok(retry2[0].log[1].retryCount = 2, 'Log retryCount is valid')
        t.ok(retry2[0].log[1].message, 'Log message exists')
        t.ok(retry2[0].log[1].duration >= 0, 'Log duration is >= 0')
        t.equal(retry2[0].log[1].data, job.data, 'Log data is valid')

        // ---------- Job Failed Retry 2 Test ----------
        t.comment('job-failed: Second Retry Job Failure')
        return jobFailed(err, retry2[0], testData)
      }).then((retry3) => {
        t.equal(retry3[0].status, enums.status.retry, 'Job status is retry')
        t.equal(retry3[0].retryCount, 3, 'Job retryCount is 3')
        t.equal(retry3[0].progress, 0, 'Job progress is 0')
        t.equal(retry3[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(retry3[0].dateFailed), 'Job dateFailed is a date')
        t.equal(retry3[0].log.length, 3, 'Job has 3 log entries')
        t.ok(moment.isDate(retry3[0].log[2].date), 'Log date is a date')
        t.equal(retry3[0].log[2].queueId, q.id, 'Log queueId is valid')
        t.equal(retry3[0].log[2].type, enums.log.warning, 'Log type is warning')
        t.equal(retry3[0].log[2].status, enums.status.retry, 'Log status is retry')
        t.ok(retry3[0].log[2].retryCount = 3, 'Log retryCount is valid')
        t.ok(retry3[0].log[2].message, 'Log message exists')
        t.ok(retry3[0].log[2].duration >= 0, 'Log duration is >= 0')
        t.equal(retry3[0].log[2].data, job.data, 'Log data is valid')

        // ---------- Job Failed Retry 3 Test ----------
        t.comment('job-failed: Third and Final Retry Job Failure')
        return jobFailed(err, retry3[0], testData)
      }).then((failed) => {
        t.equal(failed[0].status, enums.status.failed, 'Job status is failed')
        t.equal(failed[0].retryCount, 3, 'Job retryCount is 3')
        t.equal(failed[0].progress, 0, 'Job progress is 0')
        t.equal(failed[0].queueId, q.id, 'Job queueId is valid')
        t.ok(moment.isDate(failed[0].dateFailed), 'Job dateFailed is a date')
        t.equal(failed[0].log.length, 4, 'Job has 4 log entries')
        t.ok(moment.isDate(failed[0].log[3].date), 'Log date is a date')
        t.equal(failed[0].log[3].queueId, q.id, 'Log queueId is valid')
        t.equal(failed[0].log[3].type, enums.log.error, 'Log type is error')
        t.equal(failed[0].log[3].status, enums.status.failed, 'Log status is failed')
        t.ok(failed[0].log[3].retryCount = 3, 'Log retryCount is valid')
        t.ok(failed[0].log[3].message, 'Log message exists')
        t.ok(failed[0].log[3].duration >= 0, 'Log duration is >= 0')
        t.equal(failed[0].log[3].data, job.data, 'Log data is valid')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
