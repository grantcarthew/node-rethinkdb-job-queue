const test = require('tape')
const Promise = require('bluebird')
const is = require('../src/is')
const testError = require('./test-error')
const enums = require('../src/enums')
const testData = require('./test-options').testData
const Queue = require('../src/queue')
const testOptions = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-change', (t) => {
      t.plan(48)

      const q = new Queue(testOptions.queueDefault())

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
      function cancelledEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: cancelled [${jobId}]`)
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
      function logEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: log [${jobId}]`)
        }
      }
      let testEvents = false
      function addEventHandlers () {
        testEvents = true
        q.testing = true
        q.on(enums.status.added, addedEventHandler)
        q.on(enums.status.log, logEventHandler)
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
        q.testing = false
        q.removeListener(enums.status.added, addedEventHandler)
        q.removeListener(enums.status.log, logEventHandler)
        q.removeListener(enums.status.active, activeEventHandler)
        q.removeListener(enums.status.progress, progressEventHandler)
        q.removeListener(enums.status.completed, completedEventHandler)
        q.removeListener(enums.status.cancelled, cancelledEventHandler)
        q.removeListener(enums.status.failed, failedEventHandler)
        q.removeListener(enums.status.terminated, terminatedEventHandler)
        q.removeListener(enums.status.removed, removedEventHandler)
        return q.resume()
      }

      let job = q.createJob(testData)
      let processDelay = 500

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.pause()
      }).then(() => {
        q.process((j, next) => {
          setTimeout(function jobProcessing () {
            t.equal(j.id, job.id, `Job Processed [${j.id}]`)
            next(null, 'queue-change')
          }, processDelay)
          return j.setProgress(50)
        })

        // ---------- Test added, active, progress completed, removed  ----------
        t.comment('queue-change: added, active, progress, completed, and removed change events')
        addEventHandlers()
      }).then(() => {
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.resume()
      }).then(() => {
        t.ok(!q.paused, 'Queue not paused')
      }).delay(processDelay).then(() => {
        return q.pause()
      }).delay(processDelay).then(() => {
        // t.ok(q.paused, 'Queue paused')
        return q.removeJob(job.id)
      }).delay(processDelay).then(() => {
        job = q.createJob(testData)
        job.timeout = processDelay / 2000
        job.retryDelay = 0
        job.retryMax = 1

        // ---------- Test failed and terminated ----------
        t.comment('queue-change: failed and terminated change events')
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.resume()
      }).then(() => {
        t.ok(!q.paused, 'Queue not paused')
      }).delay(processDelay * 2).then(() => {
        return q.pause()
      }).delay(processDelay).then(() => {
        job = q.createJob(testData)

        // ---------- Test log and cancelled ----------
        t.comment('queue-change: log and cancelled change events')
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return savedJob[0].addLog(savedJob[0].createLog('test log'))
      }).then(() => {
        return q.cancelJob(job.id, 'testing')
      }).delay(processDelay).then(() => {
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        return removeEventHandlers()
      }).then(() => {
        q.stop()
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
