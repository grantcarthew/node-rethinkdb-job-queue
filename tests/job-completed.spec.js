const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const jobCompleted = require('../src/job-completed')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job-completed', (t) => {
      t.plan(22)

      const q = testQueue()
      let job = q.createJob(testData)
      let testEvents = false
      function completed (jobId) {
        if (testEvents) {
          t.equal(jobId, job.id, `Event: Job completed [${jobId}]`)
        }
      }
      function removed (jobId) {
        if (testEvents) {
          t.equal(jobId, job.id, `Event: Job removed [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.completed, completed)
        q.on(enums.status.removed, removed)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.completed, completed)
        q.removeListener(enums.status.removed, removed)
      }

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')

        // ---------- Job Completed Test ----------
        addEventHandlers()
        t.comment('job-completed: Job Completed')
        return jobCompleted(savedJob[0], testData)
      }).then((completedResult) => {
        t.equal(completedResult, 1, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].status, enums.status.completed, 'Job status is completed')
        t.ok(moment.isDate(updatedJob[0].dateFinished), 'Job dateFinished is a date')
        t.equal(updatedJob[0].progress, 100, 'Job progress is 100')
        t.equal(updatedJob[0].queueId, q.id, 'Job queueId is valid')
        t.equal(updatedJob[0].log.length, 1, 'Job log exists')
        t.ok(moment.isDate(updatedJob[0].log[0].date), 'Log date is a date')
        t.equal(updatedJob[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(updatedJob[0].log[0].type, enums.log.information, 'Log type is information')
        t.equal(updatedJob[0].log[0].status, enums.status.completed, 'Log status is completed')
        t.ok(updatedJob[0].log[0].retryCount >= 0, 'Log retryCount is valid')
        t.ok(updatedJob[0].log[0].message, 'Log message is present')
        t.ok(updatedJob[0].log[0].duration >= 0, 'Log duration is >= 0')
        t.equal(updatedJob[0].log[0].data, testData, 'Log data is valid')

        // ---------- Job Completed with Remove Test ----------
        t.comment('job-completed: Job Completed with Remove')
        job = q.createJob(testData)
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        q.removeFinishedJobs = true
        return jobCompleted(savedJob[0], testData)
      }).then((removedResult) => {
        t.equal(removedResult, 1, 'Job removed successfully')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        removeEventHandlers()
        q.removeFinishedJobs = 180
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
