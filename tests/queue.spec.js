const test = require('tape')
const Promise = require('bluebird')
const enums = require('../src/enums')
const is = require('../src/is')
const tError = require('./test-error')
const tOpts = require('./test-options')
const Queue = require('../src/queue')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue', (t) => {
      t.plan(157)

      let q = new Queue(tOpts.cxn(), tOpts.queueNameOnly())
      let q2

      let job
      let customJobOptions = {
        priority: 'high',
        timeout: 200,
        retryMax: 5,
        retryDelay: 400
      }
      function processHandler (job, next) {
        setTimeout(function finishJob () {
          next(`Job completed [${job.id}]`)
        }, 100)
      }

      // ---------- Event Handler Setup ----------
      let testEvents = false
      let readyEventCount = 0
      let readyEventTotal = 0
      function readyEventHandler (queueId) {
        readyEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: ready [${readyEventCount} of ${readyEventTotal}] [${queueId}]`)
        }
      }
      let addedEventCount = 0
      let addedEventTotal = 4
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
      let progressEventTotal = 0
      function progressEventHandler (jobId, percent) {
        progressEventCount++
        if (testEvents) {
          t.pass(`Event: progress  [${progressEventCount} of ${progressEventTotal}]`)
          t.ok(is.uuid(jobId), `Event: progress [${jobId}]`)
          t.ok(is.number(percent), `Event: progress [${percent}%]`)
        }
      }
      let completedEventCount = 0
      let completedEventTotal = 3
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
      let failedEventTotal = 0
      function failedEventHandler (jobId) {
        failedEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: failed [${failedEventCount} of ${failedEventTotal}] [${jobId}]`)
        }
      }
      let terminatedEventCount = 0
      let terminatedEventTotal = 0
      function terminatedEventHandler (jobId) {
        terminatedEventCount++
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: terminated [${terminatedEventCount} of ${terminatedEventTotal}] [${jobId}]`)
        }
      }
      let logEventCount = 0
      let logEventTotal = 0
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
      let pausingEventTotal = 2
      function pausingEventHandler (global, queueId) {
        pausingEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: pausing [${pausingEventCount} of ${pausingEventTotal}]`)
          t.ok(is.boolean(global), `Event: pausing [global: ${global}]`)
          t.ok(is.string(queueId), `Event: pausing [queueId: ${queueId}]`)
        }
      }
      let pausedEventCount = 0
      let pausedEventTotal = 2
      function pausedEventHandler (global, queueId) {
        pausedEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: paused [${pausedEventCount} of ${pausedEventTotal}]`)
          t.ok(is.boolean(global), `Event: paused [global: ${global}]`)
          t.ok(is.string(queueId), `Event: paused [queueId: ${queueId}]`)
        }
      }
      let resumedEventCount = 0
      let resumedEventTotal = 1
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
      let idleEventTotal = 4
      function idleEventHandler (queueId) {
        if (idleEventCount < 4) {
          idleEventCount++
          if (testEvents) {
            t.ok(is.string(queueId), `Event: idle [${idleEventCount} of ${idleEventTotal}] [${queueId}]`)
          }
        }
      }
      let reviewedEventCount = 0
      let reviewedEventTotal = 0
      function reviewedEventHandler (queueId) {
        reviewedEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: reviewed [${reviewedEventCount} of ${reviewedEventTotal}] [${queueId}]`)
        }
      }
      let resetEventCount = 0
      let resetEventTotal = 1
      function resetEventHandler (total) {
        resetEventCount++
        if (testEvents) {
          t.ok(is.integer(total), `Event: reset [${resetEventCount} of ${resetEventTotal}] [${total}]`)
        }
      }
      let errorEventCount = 0
      let errorEventTotal = 3
      function errorEventHandler (err) {
        errorEventCount++
        if (testEvents) {
          t.ok(is.string(err.message), `Event: error [${errorEventCount} of ${errorEventTotal}] [${err.message}]`)
        }
      }
      let detachedEventCount = 0
      let detachedEventTotal = 1
      function detachedEventHandler (queueId) {
        detachedEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: detached [${detachedEventCount} of ${detachedEventTotal}] [${queueId}]`)
        }
      }
      let stoppingEventCount = 0
      let stoppingEventTotal = 1
      function stoppingEventHandler (queueId) {
        stoppingEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: stopping [${stoppingEventCount} of ${stoppingEventTotal}] [${queueId}]`)
        }
      }
      let stoppedEventCount = 0
      let stoppedEventTotal = 1
      function stoppedEventHandler (queueId) {
        stoppedEventCount++
        if (testEvents) {
          t.ok(is.string(queueId), `Event: stopped [${stoppedEventCount} of ${stoppedEventTotal}] [${queueId}]`)
        }
      }
      let droppedEventCount = 0
      let droppedEventTotal = 1
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
      }

      return q.ready().then((ready) => {
        t.ok(ready, 'Queue ready returns true')

        // ---------- masterInterval Options Tests ----------
        t.comment('queue: masterInterval Options')
        return q.stop()
      }).then(() => {
        q = new Queue(tOpts.cxn(), Object.assign(tOpts.queueNameOnly(), { masterInterval: true }))
        t.ok(is.true(q.masterInterval), 'True masterInterval is true')
        return q.stop()
      }).then(() => {
        q = new Queue(tOpts.cxn(), Object.assign(tOpts.queueNameOnly(), { masterInterval: false }))
        t.ok(is.false(q.masterInterval), 'False masterInterval is false')
        return q.stop()
      }).then(() => {
        q = new Queue(tOpts.cxn(), Object.assign(tOpts.queueNameOnly(), { masterInterval: 12345 }))
        t.equal(q.masterInterval, 12345, 'Number masterInterval is number')
        return q.stop()
      }).then(() => {
        q = new Queue(tOpts.cxn(), tOpts.queueNameOnly())

        return q.reset()
      }).then((totalRemoved) => {
        t.ok(is.integer(totalRemoved), 'Queue has been reset')
        addEventHandlers()

        // ---------- Constructor with Default Options Tests ----------
        t.comment('queue: Constructor with Default Options')
        t.ok(q, 'Queue created with default options')
        t.equal(q.name, tOpts.queueName, 'Default queue name valid')
        t.ok(is.string(q.id), 'Queue id is valid')
        t.equal(q.host, enums.options.host, 'Default host name is valid')
        t.equal(q.port, enums.options.port, 'Default port is valid')
        t.equal(q.db, tOpts.dbName, 'Default db name is valid')
        t.ok(is.function(q.r), 'Queue r valid')
        t.ok(q.changeFeed, 'Queue change feed is enabled')
        t.ok(q.master, 'Queue is master queue')
        t.equal(q.masterInterval, enums.options.masterInterval, 'Queue masterInterval is valid')
        t.ok(is.object(q.jobOptions), 'Queue jobOptions is an object')
        t.equal(q.jobOptions.priority, enums.priorityFromValue(40), 'Default job priority is normal')
        t.equal(q.jobOptions.timeout, enums.options.timeout, 'Default job timeout is valid')
        t.equal(q.jobOptions.retryMax, enums.options.retryMax, 'Default job retryMax is valid')
        t.equal(q.jobOptions.retryDelay, enums.options.retryDelay, 'Default job retryDelay is valid')
        t.equal(q.removeFinishedJobs, enums.options.removeFinishedJobs, 'Default removeFinishedJobs is valid')
        t.equal(q.running, 0, 'Running jobs is zero')
        t.equal(q.concurrency, enums.options.concurrency, 'Default concurrency is valid')
        t.notOk(q.paused, 'Queue is not paused')
        t.ok(q.idle, 'Queue is idle')

        // ---------- Set Properties Tests ----------
        t.comment('queue: Set Properties')
        q.jobOptions = customJobOptions
        t.deepEqual(q.jobOptions, customJobOptions, 'Job options set successfully')
        q.jobOptions = undefined
        t.deepEqual(q.jobOptions, customJobOptions, 'Job options restored to default on invalid value')
        q.concurrency = 100
        t.equal(q.concurrency, 100, 'Queue concurrency set with valid value successfully')
        q.concurrency = -50
        t.equal(q.concurrency, 100, 'Queue concurrency unchanged with invalid value')
        q.concurrency = 1.5
        t.equal(q.concurrency, 100, 'Queue concurrency unchanged with invalid value')
        q.concurrency = 'string'
        t.equal(q.concurrency, 100, 'Queue concurrency unchanged with invalid value')

        // ---------- Create Job Tests ----------
        t.comment('queue: Create Job')
        job = q.createJob()
        t.ok(is.job(job), 'Queue createJob created a job object')
        t.equal(job.priority, customJobOptions.priority, 'Queue created job with new default priority')
        t.equal(job.timeout, customJobOptions.timeout, 'Queue created job with new default timeout')
        t.equal(job.retryMax, customJobOptions.retryMax, 'Queue created job with new default retryMax')
        t.equal(job.retryDelay, customJobOptions.retryDelay, 'Queue created job with new default retryDelay')

        customJobOptions = {
          priority: 'low',
          timeout: 400,
          retryMax: 2,
          retryDelay: 900
        }
        job = q.createJob().setPriority('low').setTimeout(400).setRetryMax(2).setRetryDelay(900)
        t.ok(is.job(job), 'Queue createJob created a job object')
        t.equal(job.priority, customJobOptions.priority, 'Queue created job with custom priority')
        t.equal(job.timeout, customJobOptions.timeout, 'Queue created job with custom timeout')
        t.equal(job.retryMax, customJobOptions.retryMax, 'Queue created job with custom retryMax')
        t.equal(job.retryDelay, customJobOptions.retryDelay, 'Queue created job with custom retryDelay')

        // ---------- Create Job Tests ----------
        t.comment('queue: Add Job')
        job = q.createJob()
        job.data = tOpts.tData
        return q.addJob(job)
      }).then((savedJobs) => {
        t.ok(is.array(savedJobs), 'Add job returns an array')
        t.ok(is.job(savedJobs[0]), 'Job saved successfully')
        t.equal(savedJobs[0].id, job.id, 'Job id is valid')
        t.equal(savedJobs[0].status, enums.status.waiting, 'Job status is valid')

        // ---------- Get Job Tests ----------
        t.comment('queue: Get Job')
        return q.getJob(savedJobs[0].id)
      }).then((savedJobs2) => {
        t.ok(is.array(savedJobs2), 'Get job returns an array')
        t.ok(is.job(savedJobs2[0]), 'Job retrieved successfully')
        t.equal(savedJobs2[0].id, job.id, 'Job id is valid')
        t.equal(savedJobs2[0].status, enums.status.waiting, 'Job status is valid')

        // ---------- Find Job Tests ----------
        t.comment('queue: Find Job')
        return q.findJob({ data: tOpts.tData })
      }).then((savedJobs3) => {
        t.ok(is.array(savedJobs3), 'Find job returns an array')
        t.ok(is.job(savedJobs3[0]), 'Job retrieved successfully')
        t.equal(savedJobs3[0].id, job.id, 'Job id is valid')
        t.equal(savedJobs3[0].status, enums.status.waiting, 'Job status is valid')

        // ---------- Cancel Job Tests ----------
        t.comment('queue: Cancel Job')
        return q.cancelJob(savedJobs3[0].id)
      }).then((cancelledJobs) => {
        t.ok(is.array(cancelledJobs), 'Cancel job returns an array')
        t.ok(is.uuid(cancelledJobs[0]), 'Cancel job returns ids')
        return q.getJob(cancelledJobs[0])
      }).then((cancelledJobs2) => {
        t.ok(is.array(cancelledJobs2), 'Get job returns an array')
        t.equal(cancelledJobs2[0].status, enums.status.cancelled, 'Cancelled job status is cancelled')

        // ---------- Remove Job Tests ----------
        t.comment('queue: Remove Job')
        return q.removeJob(cancelledJobs2[0].id)
      }).then((removedCount) => {
        t.ok(is.array(removedCount), 'Remove job returns an array')
        t.equal(removedCount.length, 1, 'Removed count is valid')
        return q.getJob(job.id)
      }).then((noJobs) => {
        t.ok(is.array(noJobs), 'Get job returns an array')
        t.equal(noJobs.length, 0, 'Removed job is not in the database')

        // ---------- Process Job Tests ----------
        t.comment('queue: Process Job')
        return q.process(processHandler)
      }).then(() => {
        job = q.createJob()
        return q.addJob(job)
      }).delay(400).then((addedJob) => {
        return q.getJob(addedJob[0].id)
      }).then((finishedJobs) => {
        t.ok(is.array(finishedJobs), 'Job is in queue')
        t.equal(finishedJobs[0].status, enums.status.completed, 'Job is completed')

        // ---------- Pause Tests ----------
        t.comment('queue: Pause')
        return q.pause()
      }).then((isPaused) => {
        t.ok(isPaused, 'Queue pause returns true')
        t.ok(q.paused, 'Queue is paused')
        job = q.createJob()
        return q.addJob(job)
      }).delay(200).then((addedJob) => {
        return q.getJob(addedJob[0].id)
      }).then((addedJobs) => {
        t.ok(is.array(addedJobs), 'Job is in queue')
        t.equal(addedJobs[0].status, enums.status.waiting, 'Job has not been processed')

        // ---------- Resume Tests ----------
        t.comment('queue: Resume')
        return q.resume()
      }).delay(200).then((isResumed) => {
        t.ok(isResumed, 'Queue resume returns true')
        t.notOk(q.paused, 'Queue is not paused')
        return q.getJob(job.id)
      }).then((finishedJobs2) => {
        t.ok(is.array(finishedJobs2), 'Job is in queue')
        t.equal(finishedJobs2[0].status, enums.status.completed, 'Job is completed')

        // ---------- Summary Tests ----------
        t.comment('queue: Summary')
        return q.summary()
      }).then((summary) => {
        t.ok(is.object(summary), 'Queue summary returns an object')
        t.equal(summary.waiting, 0, 'Summary waiting is valid')
        t.equal(summary.active, 0, 'Summary active is valid')
        t.equal(summary.completed, 2, 'Summary completed is valid')
        t.equal(summary.cancelled, 0, 'Summary cancelled is valid')
        t.equal(summary.failed, 0, 'Summary failed is valid')
        t.equal(summary.terminated, 0, 'Summary terminated is valid')
        t.equal(summary.total, 2, 'Summary total is valid')

        // ---------- Reset Tests ----------
        t.comment('queue: Reset')
        return q.reset()
      }).then((totalReset) => {
        t.ok(is.integer(totalReset), 'Queue reset returns integer')
        t.equal(totalReset, 2, 'Reset return value is valid')
        return q.summary()
      }).then((summary2) => {
        t.ok(is.object(summary2), 'Queue summary returns an object')
        t.equal(summary2.total, 0, 'Summary total is zero')

        // ---------- Stop Tests ----------
        t.comment('queue: Stop')
        return q.stop()
      }).then((stopped) => {
        t.ok(stopped, 'Queue stop returns true')
        return q.ready()
      }).then((ready) => {
        t.ok(is.false(ready), 'Queue ready returns false')
        removeEventHandlers()

        // ---------- Drop Tests ----------
        t.comment('queue: Drop')
        q = new Queue(tOpts.cxn(), tOpts.queueNameOnly())
        testEvents = true
        q.on(enums.status.dropped, droppedEventHandler)
        return q.drop()
      }).then((dropped) => {
        t.ok(dropped, 'Queue drop returns true')
        return q.ready()
      }).then((ready) => {
        testEvents = false
        q.removeListener(enums.status.dropped, droppedEventHandler)
        t.ok(is.false(ready), 'Queue ready returns false')

        // ---------- Multi Queue Tests ----------
        t.comment('queue: Multi-Queue')
        q = new Queue(tOpts.cxn(), tOpts.queueNameOnly())
        return q.ready()
      }).then((ready) => {
        t.ok(ready, `First queue ready [${q.id}]`)
        addEventHandlers()
        q2 = new Queue(tOpts.cxn(), tOpts.queueNameOnly())
        return q2.ready()
      }).then((ready2) => {
        t.ok(ready2, `Second queue ready [${q2.id}]`)
        q.process(processHandler)
        job = q2.createJob()
        return q2.addJob(job)
      }).then((jobOnQ2) => {
        t.equal(jobOnQ2[0].id, job.id, 'Job added to second queue')
      }).delay(1000).then(() => {
        return q.getJob(job.id)
      }).then((jobCheck) => {
        t.ok(is.array(jobCheck), 'Job is in queue')
        t.equal(jobCheck[0].status, enums.status.completed, 'Job is completed')

        removeEventHandlers()

        // ---------- Event summary Test ----------
        t.comment('queue: Event Summary')
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

        q.stop()
        q2.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
