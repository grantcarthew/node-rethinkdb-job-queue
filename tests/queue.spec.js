const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const enums = require('../src/enums')
const is = require('../src/is')
const testError = require('./test-error')
const testOptions = require('./test-options')
const connectionOptionsOnly = testOptions.connection()
const queueDefaultOptions = testOptions.queueDefault()
const customjobOptions = testOptions.jobOptionsHigh()
const testData = require('./test-options').testData
const jobOptions = require('../src/job-options')
const Queue = require('../src/queue')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue', (t) => {
      t.plan(600)

      let q = new Queue()

      let job
      let customJobOptions = {
        priority: 'high',
        timeout: 200,
        retryMax: 5,
        retryDelay: 400
      }

      // ---------- Event Handler Setup ----------
      let testEvents = false
      function errorEventHandler (err) {
        if (testEvents) {
          t.ok(is.string(err.message), `Event: error [${err.message}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.error, errorEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.error, errorEventHandler)
      }

      q.reset().then((ready) => {
        addEventHandlers()
        t.ok(ready, 'Queue is ready')

        // ---------- Constructor with Default Options Tests ----------
        t.comment('queue: Constructor with Default Options')
        t.ok(q, 'Queue created with default options')
        t.equal(q.name, enums.options.name, 'Default queue name valid')
        t.ok(is.string(q.id), 'Queue id is valid')
        t.equal(q.host, enums.options.host, 'Default host name is valid')
        t.equal(q.port, enums.options.port, 'Default port is valid')
        t.equal(q.db, enums.options.db, 'Default db name is valid')
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
        t.deepEqual(q.jobOptions, jobOptions(), 'Job options restored to default on invalid value')
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
        job = q.createJob(testData)
        t.ok(is.job(job), 'Queue createJob created a job object')
        t.equal(job.priority, enums.priorityFromValue(40), 'Queue created job with default priority')
        t.equal(job.timeout, enums.options.timeout, 'Queue created job with default timeout')
        t.equal(job.retryMax, enums.options.retryMax, 'Queue created job with default retryMax')
        t.equal(job.retryDelay, enums.options.retryDelay, 'Queue created job with default retryDelay')
        job = q.createJob(testData, customJobOptions)
        t.ok(is.job(job), 'Queue createJob created a job object')
        t.equal(job.priority, customJobOptions.priority, 'Queue created job with custom priority')
        t.equal(job.timeout, customJobOptions.timeout, 'Queue created job with custom timeout')
        t.equal(job.retryMax, customJobOptions.retryMax, 'Queue created job with custom retryMax')
        t.equal(job.retryDelay, customJobOptions.retryDelay, 'Queue created job with custom retryDelay')

        // ---------- Create Job Tests ----------
        t.comment('queue: Add Job')
        job = q.createJob(testData)
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
        return q.process((job, next) => {
          next(null, `Job completed [${job.id}]`)
        })
      }).then(() => {
        job = q.createJob(testData)
        return q.addJob(job)
      }).delay(200).then((addedJob) => {
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
        job = q.createJob(testData)
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

        // ---------- Reset Tests ----------
        t.comment('queue: Reset')
        return q.reset()
      }).then((totalReset) => {
        t.ok(is.integer(totalReset), 'Queue reset returns integer')
        t.equal(totalReset, 2, 'Reset return value is valid')
        return q.summary()
      }).then((summary2) => {
        t.ok(is.object(summary2), 'Queue summary returns an object')
        const summaryTotal = 0 +
          summary2.added +
          summary2.active +
          summary2.completed +
          summary2.cancelled +
          summary2.failed +
          summary2.terminated
        t.equal(summaryTotal, 0, 'Summary total is zero')


        removeEventHandlers()
      }).catch(err => testError(err, module, t))
    })
  })
}
