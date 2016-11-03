const test = require('tape')
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const Queue = require('../src/queue')
const dbReview = require('../src/db-review')
const tOpts = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-change', (t) => {
      t.plan(84)

      const q = new Queue(tOpts.cxn(), tOpts.default())
      const qPub = new Queue(tOpts.cxn(), tOpts.default())

      // ---------- Event Handler Setup ----------
      let testEvents = false
      let readyEventCount = 0
      let readyEventTotal = 1
      function readyEventHandler (queueId) {
        readyEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: ready [${readyEventCount} of ${readyEventTotal}] [${queueId}]`)
        }
      }
      let addedEventCount = 0
      let addedEventTotal = 3
      function addedEventHandler (jobId) {
        addedEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: added [${addedEventCount} of ${addedEventTotal}] [${jobId}]`)
        }
      }
      let activeEventCount = 0
      let activeEventTotal = 3
      function activeEventHandler (jobId) {
        activeEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: active [${activeEventCount} of ${activeEventTotal}] [${jobId}]`)
        }
      }
      let processingEventCount = 0
      let processingEventTotal = 3
      function processingEventHandler (jobId) {
        processingEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: processing [${processingEventCount} of ${processingEventTotal}] [${jobId}]`)
        }
      }
      let progressEventCount = 0
      let progressEventTotal = 3
      function progressEventHandler (jobId, percent) {
        progressEventCount++
        if (testEvents) {
          t.pass(`Event: progress  [${progressEventCount} of ${progressEventTotal}]`)
          t.ok(is.uuid(jobId), `Event: progress [${jobId}]`)
          t.ok(is.number(percent), `Event: progress [${percent}%]`)
        }
      }
      let completedEventCount = 0
      let completedEventTotal = 1
      function completedEventHandler (jobId) {
        completedEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: completed [${completedEventCount} of ${completedEventTotal}] [${jobId}]`)
        }
      }
      let cancelledEventCount = 0
      let cancelledEventTotal = 1
      function cancelledEventHandler (jobId) {
        cancelledEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: cancelled [${cancelledEventCount} of ${cancelledEventTotal}] [${jobId}]`)
        }
      }
      let failedEventCount = 0
      let failedEventTotal = 1
      function failedEventHandler (jobId) {
        failedEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: failed [${failedEventCount} of ${failedEventTotal}] [${jobId}]`)
        }
      }
      let terminatedEventCount = 0
      let terminatedEventTotal = 1
      function terminatedEventHandler (jobId) {
        terminatedEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: terminated [${terminatedEventCount} of ${terminatedEventTotal}] [${jobId}]`)
        }
      }
      let logEventCount = 0
      let logEventTotal = 1
      function logEventHandler (jobId) {
        logEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: log [${logEventCount} of ${logEventTotal}] [${jobId}]`)
        }
      }
      let updatedEventCount = 0
      let updatedEventTotal = 0
      function updatedEventHandler (jobId) {
        updatedEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: updated [${updatedEventCount} of ${updatedEventTotal}] [${jobId}]`)
        }
      }
      let pausingEventCount = 0
      let pausingEventTotal = 3
      function pausingEventHandler (global, queueId) {
        pausingEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: pausing [${pausingEventCount} of ${pausingEventTotal}]`)
          t.ok(is.boolean(global), `Event: pausing [global: ${global}]`)
          t.ok(is.string(queueId), `Event: pausing [queueId: ${queueId}]`)
        }
      }
      let pausedEventCount = 0
      let pausedEventTotal = 3
      function pausedEventHandler (global, queueId) {
        pausedEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: paused [${pausedEventCount} of ${pausedEventTotal}]`)
          t.ok(is.boolean(global), `Event: paused [global: ${global}]`)
          t.ok(is.string(queueId), `Event: paused [queueId: ${queueId}]`)
        }
      }
      let resumedEventCount = 0
      let resumedEventTotal = 2
      function resumedEventHandler (global, queueId) {
        resumedEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: resumed [${resumedEventCount} of ${resumedEventTotal}]`)
          t.ok(is.boolean(global), `Event: resumed [global: ${global}]`)
          t.ok(is.string(queueId), `Event: resumed [queueId: ${queueId}]`)
        }
      }
      let removedEventCount = 0
      let removedEventTotal = 1
      function removedEventHandler (jobId) {
        removedEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: removed [${removedEventCount} of ${removedEventTotal}] [${jobId}]`)
        }
      }
      let idleEventCount = 0
      let idleEventTotal = 1
      function idleEventHandler (queueId) {
        if (idleEventCount < 1) {
          idleEventCount++
          if (testEvents) {
            t.ok(is.string(queueId), `Event: idle [${idleEventCount} of ${idleEventTotal}] [${queueId}]`)
          }
        }
      }
      let reviewedEventCount = 0
      let reviewedEventTotal = 2
      function reviewedEventHandler (result) {
        reviewedEventCount++
        if (testEvents) {
          t.ok(is.object(result), `Event: reviewed [${reviewedEventCount} of ${reviewedEventTotal}]`)
        }
      }
      let resetEventCount = 0
      let resetEventTotal = 0
      function resetEventHandler (total) {
        resetEventCount++
        if (testEvents) {
          t.ok(is.integer(total), `Event: reset [${resetEventCount} of ${resetEventTotal}] [${total}]`)
        }
      }
      let errorEventCount = 0
      let errorEventTotal = 0
      function errorEventHandler (err) {
        errorEventCount++
        if (testEvents) {
          t.ok(is.string(err.message), `Event: error [${errorEventCount} of ${errorEventTotal}] [${err.message}]`)
        }
      }
      let detachedEventCount = 0
      let detachedEventTotal = 0
      function detachedEventHandler (queueId) {
        detachedEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: detached [${detachedEventCount} of ${detachedEventTotal}] [${queueId}]`)
        }
      }
      let stoppingEventCount = 0
      let stoppingEventTotal = 0
      function stoppingEventHandler (queueId) {
        stoppingEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: stopping [${stoppingEventCount} of ${stoppingEventTotal}] [${queueId}]`)
        }
      }
      let stoppedEventCount = 0
      let stoppedEventTotal = 0
      function stoppedEventHandler (queueId) {
        stoppedEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: stopped [${stoppedEventCount} of ${stoppedEventTotal}] [${queueId}]`)
        }
      }
      let droppedEventCount = 0
      let droppedEventTotal = 0
      function droppedEventHandler (queueId) {
        droppedEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: dropped [${droppedEventCount} of ${droppedEventTotal}] [${queueId}]`)
        }
      }

      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.ready, readyEventHandler)
        q.on(enums.status.added, addedEventHandler)
        q.on(enums.status.active, activeEventHandler)
        q.on(enums.status.processing, processingEventHandler)
        q.on(enums.status.progress, progressEventHandler)
        q.on(enums.status.completed, completedEventHandler)
        q.on(enums.status.cancelled, cancelledEventHandler)
        q.on(enums.status.failed, failedEventHandler)
        q.on(enums.status.terminated, terminatedEventHandler)
        q.on(enums.status.paused, pausedEventHandler)
        q.on(enums.status.pausing, pausingEventHandler)
        q.on(enums.status.resumed, resumedEventHandler)
        q.on(enums.status.removed, removedEventHandler)
        q.on(enums.status.log, logEventHandler)
        q.on(enums.status.updated, updatedEventHandler)
        q.on(enums.status.idle, idleEventHandler)
        q.on(enums.status.reviewed, reviewedEventHandler)
        q.on(enums.status.reset, resetEventHandler)
        q.on(enums.status.error, errorEventHandler)
        q.on(enums.status.detached, detachedEventHandler)
        q.on(enums.status.stopping, stoppingEventHandler)
        q.on(enums.status.stopped, stoppedEventHandler)
        q.on(enums.status.dropped, droppedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.ready, readyEventHandler)
        q.removeListener(enums.status.added, addedEventHandler)
        q.removeListener(enums.status.active, activeEventHandler)
        q.removeListener(enums.status.processing, processingEventHandler)
        q.removeListener(enums.status.progress, progressEventHandler)
        q.removeListener(enums.status.completed, completedEventHandler)
        q.removeListener(enums.status.cancelled, cancelledEventHandler)
        q.removeListener(enums.status.failed, failedEventHandler)
        q.removeListener(enums.status.terminated, terminatedEventHandler)
        q.removeListener(enums.status.paused, pausedEventHandler)
        q.removeListener(enums.status.pausing, pausingEventHandler)
        q.removeListener(enums.status.resumed, resumedEventHandler)
        q.removeListener(enums.status.removed, removedEventHandler)
        q.removeListener(enums.status.log, logEventHandler)
        q.removeListener(enums.status.updated, updatedEventHandler)
        q.removeListener(enums.status.idle, idleEventHandler)
        q.removeListener(enums.status.reviewed, reviewedEventHandler)
        q.removeListener(enums.status.reset, resetEventHandler)
        q.removeListener(enums.status.error, errorEventHandler)
        q.removeListener(enums.status.detached, detachedEventHandler)
        q.removeListener(enums.status.stopping, stoppingEventHandler)
        q.removeListener(enums.status.stopped, stoppedEventHandler)
        q.removeListener(enums.status.dropped, droppedEventHandler)
        return q.resume()
      }

      let job = qPub.createJob()
      let processDelay = 500

      addEventHandlers()

      return qPub.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.pause()
      }).then(() => {
        q.process((j, next) => {
          setTimeout(function jobProcessing () {
            t.equal(j.id, job.id, `Job Processed [${j.id}]`)
            next('queue-change')
          }, processDelay)
          return j.updateProgress(50)
        })

        // ---------- Test added, active, progress completed, removed  ----------
        t.comment('queue-change: added, active, progress, completed, and removed change events')
      }).then(() => {
        return qPub.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.resume()
      }).then(() => {
        t.ok(!q.paused, 'Queue not paused')
      }).delay(processDelay).then(() => {
        return q.pause()
      }).delay(processDelay).then(() => {
        return q.removeJob(job.id)
      }).delay(processDelay).then(() => {
        //
        // ---------- Test global review  ----------
        t.comment('queue-change: global review')
        // The following will raise a 'reviewed' event.
        return dbReview.runOnce(qPub)
      }).then(() => {
        //
        // ---------- Test failed and terminated ----------
        t.comment('queue-change: failed and terminated change events')
        job = qPub.createJob()
        job.timeout = processDelay / 2000
        job.retryDelay = 0
        job.retryMax = 1
        return qPub.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.resume()
      }).then(() => {
        t.ok(!q.paused, 'Queue not paused')
      }).delay(processDelay * 2).then(() => {
        return q.pause()
      }).delay(processDelay).then(() => {
        job = qPub.createJob()

        // ---------- Test log and cancelled ----------
        t.comment('queue-change: log and cancelled change events')
        return qPub.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return savedJob[0].addLog(null, 'test log')
      }).then(() => {
        return qPub.cancelJob(job.id, 'testing')
      }).delay(processDelay).then(() => {
        removeEventHandlers()

        // ---------- Event summary Test ----------
        t.comment('queue-change: Event Summary')
        t.equal(readyEventCount, readyEventTotal, 'Ready event count valid')
        t.equal(addedEventCount, addedEventTotal, 'Added event count valid')
        t.equal(activeEventCount, activeEventTotal, 'Active event count valid')
        t.equal(processingEventCount, processingEventTotal, 'Processing event count valid')
        t.equal(progressEventCount, progressEventTotal, 'Progress event count valid')
        t.equal(completedEventCount, completedEventTotal, 'Completed event count valid')
        t.equal(cancelledEventCount, cancelledEventTotal, 'Cancelled event count valid')
        t.equal(failedEventCount, failedEventTotal, 'Failed event count valid')
        t.equal(terminatedEventCount, terminatedEventTotal, 'Terminated event count valid')
        t.equal(pausingEventCount, pausingEventTotal, 'Pausing event count valid')
        t.equal(pausedEventCount, pausedEventTotal, 'Paused event count valid')
        t.equal(resumedEventCount, resumedEventTotal, 'Resumed event count valid')
        t.equal(removedEventCount, removedEventTotal, 'Removed event count valid')
        t.equal(logEventCount, logEventTotal, 'Log event count valid')
        t.equal(updatedEventCount, updatedEventTotal, 'Updated event count valid')
        t.equal(idleEventCount, idleEventTotal, 'Idle event count valid')
        t.equal(reviewedEventCount, reviewedEventTotal, 'Reviewed event count valid')
        t.equal(resetEventCount, resetEventTotal, 'Reset event count valid')
        t.equal(errorEventCount, errorEventTotal, 'Error event count valid')
        t.equal(detachedEventCount, detachedEventTotal, 'Detached event count valid')
        t.equal(stoppingEventCount, stoppingEventTotal, 'Stopping event count valid')
        t.equal(stoppedEventCount, stoppedEventTotal, 'Stopped event count valid')
        t.equal(droppedEventCount, droppedEventTotal, 'Dropped event count valid')

        return q.reset()
      }).then((resetResult) => {
        return Promise.all([
          q.stop(),
          qPub.stop()
        ])
      }).then(() => {
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
