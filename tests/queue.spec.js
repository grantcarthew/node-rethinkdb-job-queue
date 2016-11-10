const test = require('tape')
const Promise = require('bluebird')
const enums = require('../src/enums')
const is = require('../src/is')
const tError = require('./test-error')
const tOpts = require('./test-options')
const Queue = require('../src/queue')
const jobOptions = require('../src/job-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue'

module.exports = function () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(140)

      // ---------- Test Setup ----------
      let q = new Queue(tOpts.cxn(), tOpts.queueNameOnly())
      let q2

      let job
      let customJobOptions = {
        priority: 'high',
        timeout: 200,
        retryMax: 5,
        retryDelay: 400,
        repeat: 5,
        repeatDelay: 5000
      }
      function processHandler (job, next) {
        setTimeout(function finishJob () {
          next(`Job completed [${job.id}]`)
        }, 100)
      }

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 2,
        progress: 0,
        pausing: 2,
        paused: 2,
        resumed: 1,
        removed: 1,
        idle: 12,
        reset: 1,
        error: 3,
        reviewed: 0,
        detached: 1,
        stopping: 1,
        stopped: 1,
        dropped: 0,
        added: 3,
        waiting: 0,
        active: 2,
        completed: 2,
        cancelled: 1,
        failed: 0,
        terminated: 0,
        reanimated: 0,
        log: 0,
        updated: 0
      }

      return q.ready().then((ready) => {
        t.ok(ready, 'Queue ready returns true')

        // ---------- masterInterval Options Tests ----------
        t.comment('queue: masterInterval Options')
        return q.stop()
      }).then(() => {
        q = new Queue(tOpts.cxn(), Object.assign(tOpts.queueNameOnly(), { masterInterval: true }))
        t.ok(is.true(q.masterInterval), 'True masterInterval is true')
        return q.ready()
      }).then(() => {
        return q.stop()
      }).then(() => {
        q = new Queue(tOpts.cxn(), Object.assign(tOpts.queueNameOnly(), { masterInterval: false }))
        t.ok(is.false(q.masterInterval), 'False masterInterval is false')
        return q.ready()
      }).then(() => {
        return q.stop()
      }).then(() => {
        q = new Queue(tOpts.cxn(), Object.assign(tOpts.queueNameOnly(), { masterInterval: 12345 }))
        t.equal(q.masterInterval, 12345, 'Number masterInterval is number')
        return q.ready()
      }).then(() => {
        return q.stop()
      }).then(() => {
        q = new Queue(tOpts.cxn(), tOpts.queueNameOnly())

        return q.ready()
      }).then(() => {
        return q.reset()
      }).then((totalRemoved) => {
        t.ok(is.integer(totalRemoved), 'Queue has been reset')
        eventHandlers.add(t, q, state)

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
        t.equal(q.jobOptions.repeat, enums.options.repeat, 'Default job repeat is valid')
        t.equal(q.jobOptions.repeatDelay, enums.options.repeatDelay, 'Default job repeatDelay is valid')
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
          retryDelay: 900,
          repeat: 0
        }
        job = q.createJob().setPriority('low').setTimeout(400).setRetryMax(2).setRetryDelay(900)
        t.ok(is.job(job), 'Queue createJob created a job object')
        t.equal(job.priority, customJobOptions.priority, 'Queue created job with custom priority')
        t.equal(job.timeout, customJobOptions.timeout, 'Queue created job with custom timeout')
        t.equal(job.retryMax, customJobOptions.retryMax, 'Queue created job with custom retryMax')
        t.equal(job.retryDelay, customJobOptions.retryDelay, 'Queue created job with custom retryDelay')

        // ---------- Add Job Tests ----------
        t.comment('queue: Add Job')
        q.jobOptions = jobOptions() // Resetting job options
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

        // ---------- Drop Tests ----------
        t.comment('queue: Drop')
        q = new Queue(tOpts.cxn(), tOpts.queueNameOnly())
        return q.drop()
      }).then((dropped) => {
        t.ok(dropped, 'Queue drop returns true')
        return q.ready()
      }).then((ready) => {
        t.ok(is.false(ready), 'Queue ready returns false')

        // ---------- Multi Queue Tests ----------
        t.comment('queue: Multi-Queue')
        q = new Queue(tOpts.cxn(), tOpts.queueNameOnly())
        return q.ready()
      }).then((ready) => {
        t.ok(ready, `First queue ready [${q.id}]`)
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

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)

        return Promise.all([
          q.stop(),
          q2.stop()
        ])
      }).then(() => {
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
