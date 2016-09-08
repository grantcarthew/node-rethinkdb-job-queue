const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const enums = require('../src/enums')
const queueCancelJob = require('../src/queue-cancel-job')
const testData = require('./test-options').testData
const Queue = require('../src/queue')
const testOptions = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-cancel-job', (t) => {
      t.plan(40)

      const q = new Queue(testOptions.default())

      // ---------- Event Handler Setup ----------
      let testEvents = false
      function cancelledEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: Job cancelled [${jobId}]`)
        }
      }
      function removedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: Job removed [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.cancelled, cancelledEventHandler)
        q.on(enums.status.removed, removedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.cancelled, cancelledEventHandler)
        q.removeListener(enums.status.removed, removedEventHandler)
      }

      const jobsToCreate = 5
      let jobs = q.createJob(jobsToCreate)
      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, jobsToCreate, 'Jobs saved successfully')

        // ---------- Cancel Multiple Jobs Tests ----------
        addEventHandlers()
        t.comment('queue-cancel-job: Cancel Multiple Jobs')
        return queueCancelJob(q, savedJobs, testData)
      }).then((cancelResult) => {
        t.equal(cancelResult.length, jobsToCreate, 'Job cancelled successfully')
        jobs = q.createJob()
        return q.addJob(jobs)
      }).then((singleJob) => {
        t.equal(singleJob[0].id, jobs.id, 'Jobs saved successfully')

        // ---------- Cancel Single Job Tests ----------
        t.comment('queue-cancel-job: Cancel Single Job')
        return queueCancelJob(q, singleJob[0], testData)
      }).then((cancelledJobId) => {
        t.ok(is.uuid(cancelledJobId[0]), 'Cancel Job returned Id')
        return q.getJob(cancelledJobId)
      }).then((cancelledJob) => {
        t.equal(cancelledJob[0].status, enums.status.cancelled, 'Job status is cancelled')
        t.ok(is.date(cancelledJob[0].dateFinished), 'Job dateFinished is a date')
        t.equal(cancelledJob[0].queueId, q.id, 'Job queueId is valid')
        t.equal(cancelledJob[0].log.length, 2, 'Job log exists')
        t.ok(is.date(cancelledJob[0].log[1].date), 'Log date is a date')
        t.equal(cancelledJob[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(cancelledJob[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(cancelledJob[0].log[1].status, enums.status.cancelled, 'Log status is cancelled')
        t.ok(cancelledJob[0].log[1].retryCount >= 0, 'Log retryCount is valid')
        t.equal(cancelledJob[0].log[1].message, testData, 'Log message is present')

        // ---------- Cancel Multiple Jobs with Remove Tests ----------
        t.comment('queue-cancel-job: Cancel Multiple Jobs with Remove')
        jobs = q.createJob(jobsToCreate)
        q._removeFinishedJobs = true
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, jobsToCreate, 'Jobs saved successfully')
        return queueCancelJob(q, savedJobs, testData)
      }).then((cancelResult) => {
        t.equal(cancelResult.length, 5, 'Cancel Job returned valid number of Ids')
        cancelResult.forEach((jobId) => {
          t.ok(is.uuid(jobId), 'Cancel job returned item is a valid Id')
        })
        return q.getJob(cancelResult)
      }).then((cancelledJobs) => {
        t.equal(cancelledJobs.length, 0, 'Cancelled jobs not in database')
      }).then(() => {
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
