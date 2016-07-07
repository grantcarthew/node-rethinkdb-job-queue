const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const queueCancelJob = require('../src/queue-cancel-job')
const testData = require('./test-options').testData
const isUuid = require('isuuid')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-cancel-job', (t) => {
      t.plan(21)

      const q = testQueue()
      function cancelled (jobId) {
        t.ok(isUuid(jobId), `Event: Job cancelled [${jobId}]`)
      }
      q.on(enums.status.cancelled, cancelled)

      const jobsToCreate = 5
      let jobs = q.createJob(testData, jobsToCreate)
      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, jobsToCreate, 'Jobs saved successfully')

        // ---------- Cancel Multiple Jobs Tests ----------
        t.comment('queue-cancel-job: Cancel Multiple Jobs')
        return queueCancelJob(q, savedJobs, testData)
      }).then((cancelResult) => {
        t.equal(cancelResult.length, jobsToCreate, 'Job cancelled successfully')
        jobs = q.createJob(testData)
        return q.addJob(jobs)
      }).then((singleJob) => {
        t.equal(singleJob[0].id, jobs.id, 'Jobs saved successfully')

        // ---------- Cancel Single Job Tests ----------
        t.comment('queue-cancel-job: Cancel Single Job')
        return queueCancelJob(q, singleJob[0], testData)
      }).then((cancelledJob) => {
        t.equal(cancelledJob[0].status, enums.status.cancelled, 'Job status is cancelled')
        t.ok(moment.isDate(cancelledJob[0].dateCancelled), 'Job dateCancelled is a date')
        t.equal(cancelledJob[0].queueId, q.id, 'Job queueId is valid')
        t.equal(cancelledJob[0].log.length, 1, 'Job log exists')
        t.ok(moment.isDate(cancelledJob[0].log[0].date), 'Log date is a date')
        t.equal(cancelledJob[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(cancelledJob[0].log[0].type, enums.log.information, 'Log type is information')
        t.equal(cancelledJob[0].log[0].status, enums.status.cancelled, 'Log status is cancelled')
        t.ok(cancelledJob[0].log[0].retryCount >= 0, 'Log retryCount is valid')
        t.equal(cancelledJob[0].log[0].message, testData, 'Log message is present')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.removeListener(enums.status.cancelled, cancelled)
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
