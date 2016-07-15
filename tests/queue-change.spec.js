const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const queueAddJob = require('../src/queue-add-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-change', (t) => {
      t.plan(30)

      const q = testQueue()

      function addedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: added [${jobId}]`)
        }
      }
      function activeEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: active [${jobId}]`)
        }
      }
      function progressEventHandler (jobId, percent) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: progress [${jobId}]`)
          t.ok(is.number(percent), `Event: progress [${percent}%]`)
        }
      }
      function completedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: completed [${jobId}]`)
        }
      }
      function cancelledEventHandler (jobIds) {
        if (testEvents) {
          t.ok(is.array(jobIds), `Event: cancelled with job id array`)
          t.ok(is.uuid(jobIds[0]), `Event: cancelled with valid id in array`)
        }
      }
      function failedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: failed [${jobId}]`)
        }
      }
      function terminatedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: terminated [${jobId}]`)
        }
      }
      function removedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: removed [${jobId}]`)
        }
      }
      let testEvents = false
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.added, addedEventHandler)
        q.on(enums.status.active, activeEventHandler)
        q.on(enums.status.progress, progressEventHandler)
        q.on(enums.status.completed, completedEventHandler)
        q.on(enums.status.cancelled, cancelledEventHandler)
        q.on(enums.status.failed, failedEventHandler)
        q.on(enums.status.terminated, terminatedEventHandler)
        q.on(enums.status.removed, removedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.added, addedEventHandler)
        q.removeListener(enums.status.active, activeEventHandler)
        q.removeListener(enums.status.progress, progressEventHandler)
        q.removeListener(enums.status.completed, completedEventHandler)
        q.removeListener(enums.status.cancelled, cancelledEventHandler)
        q.removeListener(enums.status.failed, failedEventHandler)
        q.removeListener(enums.status.terminated, terminatedEventHandler)
        q.removeListener(enums.status.removed, removedEventHandler)
      }

      const job = q.createJob(testData)

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.pause()
      }).then(() => {
        q.testing = true
        q.process((j, next) => {
          t.equal(j.id, job.id, `Job Processed [${j.id}]`)
          next(null, 'queue-change')
        })
        addEventHandlers()
      }).then(() => {
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.resume()
      }).then(() => {
        t.ok(!q.paused, 'Queue not paused')
        //return q.removeJob(job.id)
      }).then((removeResult) => {
        return q.reset()
      }).delay(2000).then((resetResult) => {
        t.skip(resetResult >= 0, 'Queue reset')
        //removeEventHandlers()
        // resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
