const test = require('tape')
const Promise = require('bluebird')
const enums = require('../src/enums')
const is = require('../src/is')
const testError = require('./test-error')
const testOptions = require('./test-options')
const testData = require('./test-options').testData
const Queue = require('../src/queue')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue', (t) => {
      t.plan(107)

      let q = new Queue(testOptions.queueNameOnly())
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
          next(null, `Job completed [${job.id}]`)
        }, 100)
      }

      // ---------- Event Handler Setup ----------
      let testEvents = false
      function readyEventHandler (qId) {
        if (testEvents) {
          t.ok(is.string(qId), `Event: ready [${qId}]`)
        }
      }
      function addedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: added [${jobId}]`)
        }
      }
      function processingEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: processing [${jobId}]`)
        }
      }
      function pausedEventHandler (qId) {
        if (testEvents) {
          t.ok(is.string(qId), `Event: paused [${qId}]`)
        }
      }
      function resumedEventHandler (qId) {
        if (testEvents) {
          t.ok(is.string(qId), `Event: resumed [${qId}]`)
        }
      }
      function removedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: removed [${jobId}]`)
        }
      }
      function idleEventHandler (qId) {
        if (testEvents) {
          t.ok(is.string(qId), `Event: idle [${qId}]`)
          q.removeListener(enums.status.idle, idleEventHandler)
        }
      }
      function resetEventHandler (total) {
        if (testEvents) {
          t.ok(is.integer(total), `Event: reset [${total}]`)
        }
      }
      function errorEventHandler (err) {
        if (testEvents) {
          t.ok(is.string(err.message), `Event: error [${err.message}]`)
        }
      }
      function detachedEventHandler (qId) {
        if (testEvents) {
          t.ok(is.string(qId), `Event: detached [${qId}]`)
        }
      }
      function stoppingEventHandler (qId) {
        if (testEvents) {
          t.ok(is.string(qId), `Event: stopping [${qId}]`)
        }
      }
      function stoppedEventHandler (qId) {
        if (testEvents) {
          t.ok(is.string(qId), `Event: stopped [${qId}]`)
        }
      }
      function droppedEventHandler (qId) {
        if (testEvents) {
          t.ok(is.string(qId), `Event: dropped[${qId}]`)
        }
      }

      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.ready, readyEventHandler)
        q.on(enums.status.added, addedEventHandler)
        q.on(enums.status.processing, processingEventHandler)
        q.on(enums.status.paused, pausedEventHandler)
        q.on(enums.status.resumed, resumedEventHandler)
        q.on(enums.status.removed, removedEventHandler)
        q.on(enums.status.idle, idleEventHandler)
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
        q.removeListener(enums.status.processing, processingEventHandler)
        q.removeListener(enums.status.paused, pausedEventHandler)
        q.removeListener(enums.status.resumed, resumedEventHandler)
        q.removeListener(enums.status.removed, removedEventHandler)
        q.removeListener(enums.status.idle, idleEventHandler)
        q.removeListener(enums.status.reset, resetEventHandler)
        q.removeListener(enums.status.error, errorEventHandler)
        q.removeListener(enums.status.detached, detachedEventHandler)
        q.removeListener(enums.status.stopping, stoppingEventHandler)
        q.removeListener(enums.status.stopped, stoppedEventHandler)
        q.removeListener(enums.status.dropped, droppedEventHandler)
      }

      return q.ready().then((ready) => {
        t.ok(ready, 'Queue ready returns true')
        return q.reset()
      }).then((totalRemoved) => {
        t.ok(is.integer(totalRemoved), 'Queue has been reset')
        addEventHandlers()

        // ---------- Constructor with Default Options Tests ----------
        t.comment('queue: Constructor with Default Options')
        t.ok(q, 'Queue created with default options')
        t.equal(q.name, testOptions.queueName, 'Default queue name valid')
        t.ok(is.string(q.id), 'Queue id is valid')
        t.equal(q.host, enums.options.host, 'Default host name is valid')
        t.equal(q.port, enums.options.port, 'Default port is valid')
        t.equal(q.db, testOptions.dbName, 'Default db name is valid')
        t.ok(is.function(q.r), 'Queue r valid')
        t.ok(is.function(q.connection), 'Queue connection valid')
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
        q.jobOptions = null
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
        job = q.createJob().setPayload(testData)
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
        job = q.createJob(customJobOptions).setPayload(testData)
        t.ok(is.job(job), 'Queue createJob created a job object')
        t.equal(job.priority, customJobOptions.priority, 'Queue created job with custom priority')
        t.equal(job.timeout, customJobOptions.timeout, 'Queue created job with custom timeout')
        t.equal(job.retryMax, customJobOptions.retryMax, 'Queue created job with custom retryMax')
        t.equal(job.retryDelay, customJobOptions.retryDelay, 'Queue created job with custom retryDelay')

        // ---------- Create Job Tests ----------
        t.comment('queue: Add Job')
        job = q.createJob().setPayload(testData)
        return q.addJob(job)
      }).then((savedJobs) => {
        t.ok(is.array(savedJobs), 'Add job returns an array')
        t.ok(is.job(savedJobs[0]), 'Job saved successfully')
        t.equal(savedJobs[0].id, job.id, 'Job id is valid')
        t.equal(savedJobs[0].status, enums.status.added, 'Job status is valid')

        // ---------- Get Job Tests ----------
        t.comment('queue: Get Job')
        return q.getJob(savedJobs[0].id)
      }).then((savedJobs2) => {
        t.ok(is.array(savedJobs2), 'Get job returns an array')
        t.ok(is.job(savedJobs2[0]), 'Job retrieved successfully')
        t.equal(savedJobs2[0].id, job.id, 'Job id is valid')
        t.equal(savedJobs2[0].status, enums.status.added, 'Job status is valid')

        // ---------- Cancel Job Tests ----------
        t.comment('queue: Cancel Job')
        return q.cancelJob(savedJobs2[0].id)
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
        t.ok(is.integer(removedCount), 'Remove job returns an integer')
        t.equal(removedCount, 1, 'Removed count is valid')
        return q.getJob(job.id)
      }).then((noJobs) => {
        t.ok(is.array(noJobs), 'Get job returns an array')
        t.equal(noJobs.length, 0, 'Removed job is not in the database')

        // ---------- Process Job Tests ----------
        t.comment('queue: Process Job')
        return q.process(processHandler)
      }).then(() => {
        job = q.createJob().setPayload(testData)
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
        job = q.createJob().setPayload(testData)
        return q.addJob(job)
      }).delay(200).then((addedJob) => {
        return q.getJob(addedJob[0].id)
      }).then((addedJobs) => {
        t.ok(is.array(addedJobs), 'Job is in queue')
        t.equal(addedJobs[0].status, enums.status.added, 'Job has not been processed')

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
        t.equal(summary.added, 0, 'Summary added is valid')
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
        q = new Queue(testOptions.queueNameOnly())
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
        q = new Queue(testOptions.queueNameOnly())
        return q.ready()
      }).then((ready) => {
        t.ok(ready, `First queue ready [${q.id}]`)
        addEventHandlers()
        q2 = new Queue(testOptions.queueNameOnly())
        return q2.ready()
      }).then((ready2) => {
        t.ok(ready2, `Second queue ready [${q2.id}]`)
        q.process(processHandler)
        job = q2.createJob().setPayload(testData)
        return q2.addJob(job)
      }).then((jobOnQ2) => {
        t.equal(jobOnQ2[0].id, job.id, 'Job added to second queue')
      }).delay(1000).then(() => {
        return q.getJob(job.id)
      }).then((jobCheck) => {
        t.ok(is.array(jobCheck), 'Job is in queue')
        t.equal(jobCheck[0].status, enums.status.completed, 'Job is completed')

        removeEventHandlers()
        q.stop()
        q2.stop()
        return resolve(t.end())
      }).catch(err => testError(err, module, t))
    })
  })
}
