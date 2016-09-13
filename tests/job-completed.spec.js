const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const jobCompleted = require('../src/job-completed')
const tData = require('./test-options').tData
const Queue = require('../src/queue')
const tOpts = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job-completed', (t) => {
      t.plan(23)

      const q = new Queue(tOpts.cxn(), tOpts.default())
      let job = q.createJob()
      job.data = tData

      // ---------- Event Handler Setup ----------
      let testEvents = false
      function completedEventHandler (jobId) {
        if (testEvents) {
          t.equal(jobId, job.id, `Event: Job completed [${jobId}]`)
        }
      }
      function removedEventHandler (jobId) {
        if (testEvents) {
          t.equal(jobId, job.id, `Event: Job removed [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.completed, completedEventHandler)
        q.on(enums.status.removed, removedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.completed, completedEventHandler)
        q.removeListener(enums.status.removed, removedEventHandler)
      }

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')

        // ---------- Job Completed Test ----------
        addEventHandlers()
        t.comment('job-completed: Job Completed')
        return jobCompleted(savedJob[0], tData)
      }).then((completedIds) => {
        t.equal(completedIds.length, 1, 'Job updated successfully')
        return q.getJob(completedIds)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].status, enums.status.completed, 'Job status is completed')
        t.ok(is.date(updatedJob[0].dateFinished), 'Job dateFinished is a date')
        t.equal(updatedJob[0].progress, 100, 'Job progress is 100')
        t.equal(updatedJob[0].queueId, q.id, 'Job queueId is valid')
        t.equal(updatedJob[0].log.length, 2, 'Job log exists')
        t.ok(is.date(updatedJob[0].log[1].date), 'Log date is a date')
        t.equal(updatedJob[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(updatedJob[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(updatedJob[0].log[1].status, enums.status.completed, 'Log status is completed')
        t.ok(updatedJob[0].log[1].retryCount >= 0, 'Log retryCount is valid')
        t.ok(updatedJob[0].log[1].message, 'Log message is present')
        t.ok(updatedJob[0].log[1].duration >= 0, 'Log duration is >= 0')
        t.equal(updatedJob[0].log[1].data, tData, 'Log data is valid')

        // ---------- Job Completed with Remove Test ----------
        t.comment('job-completed: Job Completed with Remove')
        job = q.createJob()
        job.data = tData
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        q._removeFinishedJobs = true
        return jobCompleted(savedJob[0], tData)
      }).then((removedIds) => {
        t.equal(removedIds.length, 1, 'Job removed successfully')
        return q.getJob(removedIds[0])
      }).then((exist) => {
        t.equal(exist.length, 0, 'Job not in database')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        removeEventHandlers()
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
