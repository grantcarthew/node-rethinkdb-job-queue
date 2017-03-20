const test = require('tap').test
const Promise = require('bluebird')
const enums = require('../src/enums')
const is = require('../src/is')
const tError = require('./test-error')
const tOpts = require('./test-options')
const Queue = require('../src/queue')
const jobOptions = require('../src/job-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue'

queueTests()
function queueTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(157)

      // ---------- Test Setup ----------
      const tableName = 'queue'
      let qReady = new Queue(tOpts.cxn(), tOpts.queueNameOnly(tableName))
      let qNotMaster
      let qNumMaster
      let qMain
      let qDrop
      let qSub
      let qPub

      let job
      let jobName = 'rjqTestJob'
      let customJobOptions = {
        name: jobName,
        priority: 'high',
        timeout: 200,
        retryMax: 5,
        retryDelay: 400,
        repeat: 5,
        repeatDelay: 5000
      }
      function processHandler (job, next) {
        setTimeout(function finishJob () {
          next(null, `Job completed [${job.id}]`)
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
        reanimated: 1,
        log: 0,
        updated: 0
      }

      const stopDelay = 1000

      return qReady.ready().then((ready) => {
        t.ok(ready, 'Queue ready returns true')
        return qReady.reset()
      }).delay(stopDelay).then(() => {
        t.pass('Queue reset')
        return qReady.stop()
      }).then(() => {
        // ---------- masterInterval Options Tests ----------
        t.comment('queue: masterInterval Options')
        qNotMaster = new Queue(tOpts.cxn(), Object.assign(tOpts.queueNameOnly(tableName), { masterInterval: false }))
        t.ok(is.false(qNotMaster.masterInterval), 'False masterInterval is false')
        return qNotMaster.ready()
      }).delay(stopDelay).then(() => {
        return qNotMaster.stop()
      }).then(() => {
        qNumMaster = new Queue(tOpts.cxn(), Object.assign(tOpts.queueNameOnly(tableName), { masterInterval: 12345 }))
        t.equal(qNumMaster.masterInterval, 12345, 'Number masterInterval is number')
        return qNumMaster.ready()
      }).delay(stopDelay).then(() => {
        return qNumMaster.stop()
      }).then(() => {
        qMain = new Queue(tOpts.cxn(), tOpts.queueNameOnly(tableName))

        return qMain.ready()
      }).then(() => {
        return qMain.reset()
      }).then((totalRemoved) => {
        t.ok(is.integer(totalRemoved), 'Queue has been reset')
        eventHandlers.add(t, qMain, state)

        // ---------- Constructor with Default Options Tests ----------
        t.comment('queue: Constructor with Default Options')
        t.ok(qMain, 'Queue created with default options')
        t.equal(qMain.name, tableName, 'Default queue name valid')
        t.ok(is.string(qMain.id), 'Queue id is valid')
        t.equal(qMain.host, enums.options.host, 'Default host name is valid')
        t.equal(qMain.port, enums.options.port, 'Default port is valid')
        t.equal(qMain.db, tOpts.dbName, 'Default db name is valid')
        t.ok(is.function(qMain.r), 'Queue r valid')
        t.ok(qMain.changeFeed, 'Queue change feed is enabled')
        t.ok(qMain.master, 'Queue is master queue')
        t.equal(qMain.masterInterval, enums.options.masterInterval, 'Queue masterInterval is valid')
        t.ok(is.object(qMain.jobOptions), 'Queue jobOptions is an object')
        t.equal(qMain.jobOptions.priority, enums.priorityFromValue(40), 'Default job priority is normal')
        t.equal(qMain.jobOptions.timeout, enums.options.timeout, 'Default job timeout is valid')
        t.equal(qMain.jobOptions.retryMax, enums.options.retryMax, 'Default job retryMax is valid')
        t.equal(qMain.jobOptions.retryDelay, enums.options.retryDelay, 'Default job retryDelay is valid')
        t.equal(qMain.jobOptions.repeat, enums.options.repeat, 'Default job repeat is valid')
        t.equal(qMain.jobOptions.repeatDelay, enums.options.repeatDelay, 'Default job repeatDelay is valid')
        t.equal(qMain.limitJobLogs, enums.options.limitJobLogs, 'Default limitJobLogs is valid')
        t.equal(qMain.removeFinishedJobs, enums.options.removeFinishedJobs, 'Default removeFinishedJobs is valid')
        t.equal(qMain.running, 0, 'Running jobs is zero')
        t.equal(qMain.concurrency, enums.options.concurrency, 'Default concurrency is valid')
        t.notOk(qMain.paused, 'Queue is not paused')
        t.ok(qMain.idle, 'Queue is idle')

        // ---------- Set Properties Tests ----------
        t.comment('queue: Set Properties')
        qMain.jobOptions = customJobOptions
        t.deepEqual(qMain.jobOptions, customJobOptions, 'Job options set successfully')
        qMain.jobOptions = undefined
        t.deepEqual(qMain.jobOptions, customJobOptions, 'Job options restored to default on invalid value')
        qMain.concurrency = 100
        t.equal(qMain.concurrency, 100, 'Queue concurrency set with valid value successfully')
        qMain.concurrency = -50
        t.equal(qMain.concurrency, 100, 'Queue concurrency unchanged with invalid value')
        qMain.concurrency = 1.5
        t.equal(qMain.concurrency, 100, 'Queue concurrency unchanged with invalid value')
        qMain.concurrency = 'string'
        t.equal(qMain.concurrency, 100, 'Queue concurrency unchanged with invalid value')

        // ---------- Create Job Tests ----------
        t.comment('queue: Create Job')
        job = qMain.createJob()
        t.ok(is.job(job), 'Queue createJob created a job object')
        t.equal(job.name, customJobOptions.name, 'Queue created job with new default name')
        t.equal(job.priority, customJobOptions.priority, 'Queue created job with new default priority')
        t.equal(job.timeout, customJobOptions.timeout, 'Queue created job with new default timeout')
        t.equal(job.retryMax, customJobOptions.retryMax, 'Queue created job with new default retryMax')
        t.equal(job.retryDelay, customJobOptions.retryDelay, 'Queue created job with new default retryDelay')

        customJobOptions = {
          name: 'aaa',
          priority: 'low',
          timeout: 400,
          retryMax: 2,
          retryDelay: 900,
          repeat: 0
        }
        job = qMain.createJob().setName('aaa').setPriority('low').setTimeout(400).setRetryMax(2).setRetryDelay(900)
        t.ok(is.job(job), 'Queue createJob created a job object')
        t.equal(job.name, customJobOptions.name, 'Queue created job with custom name')
        t.equal(job.priority, customJobOptions.priority, 'Queue created job with custom priority')
        t.equal(job.timeout, customJobOptions.timeout, 'Queue created job with custom timeout')
        t.equal(job.retryMax, customJobOptions.retryMax, 'Queue created job with custom retryMax')
        t.equal(job.retryDelay, customJobOptions.retryDelay, 'Queue created job with custom retryDelay')

        // ---------- Add Job Tests ----------
        t.comment('queue: Add Job')
        qMain.jobOptions = jobOptions() // Resetting job options
        job = qMain.createJob()
        job.data = tOpts.tData
        return qMain.addJob(job)
      }).then((savedJobs) => {
        t.ok(is.array(savedJobs), 'Add job returns an array')
        t.ok(is.job(savedJobs[0]), 'Job saved successfully')
        t.equal(savedJobs[0].id, job.id, 'Job id is valid')
        t.equal(savedJobs[0].status, enums.status.waiting, 'Job status is valid')

        // ---------- Get Job Tests ----------
        t.comment('queue: Get Job')
        return qMain.getJob(savedJobs[0].id)
      }).then((savedJobs2) => {
        t.ok(is.array(savedJobs2), 'Get job returns an array')
        t.ok(is.job(savedJobs2[0]), 'Job retrieved successfully')
        t.equal(savedJobs2[0].id, job.id, 'Job id is valid')
        t.equal(savedJobs2[0].status, enums.status.waiting, 'Job status is valid')

        // ---------- Find Job Tests ----------
        t.comment('queue: Find Job')
        return qMain.findJob({ data: tOpts.tData })
      }).then((savedJobs3) => {
        t.ok(is.array(savedJobs3), 'Find job returns an array')
        t.ok(is.job(savedJobs3[0]), 'Job retrieved successfully')
        t.equal(savedJobs3[0].id, job.id, 'Job id is valid')
        t.equal(savedJobs3[0].status, enums.status.waiting, 'Job status is valid')

        // ---------- Contains Job By Name Tests ----------
        t.comment('queue: Contains Job By Name')
        return qMain.containsJobByName(jobName)
      }).then((exists) => {
        t.ok(is.true(exists), 'Contains job by name returns true')
        return qMain.containsJobByName('not a valid name!')
      }).then((exists) => {
        t.ok(is.false(exists), 'Contains job by name returns false')

        // ---------- Find Job By Name Tests ----------
        t.comment('queue: Find Job By Name')
        return qMain.findJobByName(jobName)
      }).then((savedJobs4) => {
        t.ok(is.array(savedJobs4), 'Find job by name returns an array')
        t.ok(is.job(savedJobs4[0]), 'Job retrieved successfully')
        t.equal(savedJobs4[0].id, job.id, 'Job id is valid')
        t.equal(savedJobs4[0].name, jobName, 'Job name is valid')
        t.equal(savedJobs4[0].status, enums.status.waiting, 'Job status is valid')

        // ---------- Cancel Job Tests ----------
        t.comment('queue: Cancel Job')
        return qMain.cancelJob(savedJobs4[0].id)
      }).then((cancelledJobs) => {
        t.ok(is.array(cancelledJobs), 'Cancel job returns an array')
        t.ok(is.uuid(cancelledJobs[0]), 'Cancel job returns ids')
        return qMain.getJob(cancelledJobs[0])
      }).then((cancelledJobs2) => {
        t.ok(is.array(cancelledJobs2), 'Get job returns an array')
        t.equal(cancelledJobs2[0].status, enums.status.cancelled, 'Cancelled job status is cancelled')

        // ---------- Reanimate Job Tests ----------
        t.comment('queue: Reanimate Job')
        return qMain.reanimateJob(job.id)
      }).then((reanimatedJobs) => {
        t.ok(is.array(reanimatedJobs), 'Reanimate job returns an array')
        t.ok(is.uuid(reanimatedJobs[0]), 'Reanimate job returns ids')
        return qMain.getJob(reanimatedJobs[0])
      }).then((reanimatedJobs2) => {
        t.ok(is.array(reanimatedJobs2), 'Get job returns an array')
        t.equal(reanimatedJobs2[0].status, enums.status.waiting, 'Reanimated job status is waiting')

        // ---------- Remove Job Tests ----------
        t.comment('queue: Remove Job')
        return qMain.removeJob(job.id)
      }).then((removedCount) => {
        t.ok(is.array(removedCount), 'Remove job returns an array')
        t.equal(removedCount.length, 1, 'Removed count is valid')
        return qMain.getJob(job.id)
      }).then((noJobs) => {
        t.ok(is.array(noJobs), 'Get job returns an array')
        t.equal(noJobs.length, 0, 'Removed job is not in the database')

        // ---------- Process Job Tests ----------
        t.comment('queue: Process Job')
        return qMain.process(processHandler)
      }).then(() => {
        job = qMain.createJob()
        return qMain.addJob(job)
      }).delay(400).then((addedJob) => {
        return qMain.getJob(addedJob[0].id)
      }).then((finishedJobs) => {
        t.ok(is.array(finishedJobs), 'Job is in queue')
        t.equal(finishedJobs[0].status, enums.status.completed, 'Job is completed')

        // ---------- Pause Tests ----------
        t.comment('queue: Pause')
        return qMain.pause()
      }).then((isPaused) => {
        t.ok(isPaused, 'Queue pause returns true')
        t.ok(qMain.paused, 'Queue is paused')
        job = qMain.createJob()
        return qMain.addJob(job)
      }).delay(200).then((addedJob) => {
        return qMain.getJob(addedJob[0].id)
      }).then((addedJobs) => {
        t.ok(is.array(addedJobs), 'Job is in queue')
        t.equal(addedJobs[0].status, enums.status.waiting, 'Job has not been processed')

        // ---------- Resume Tests ----------
        t.comment('queue: Resume')
        return qMain.resume()
      }).delay(200).then((isResumed) => {
        t.ok(isResumed, 'Queue resume returns true')
        t.notOk(qMain.paused, 'Queue is not paused')
        return qMain.getJob(job.id)
      }).then((finishedJobs2) => {
        t.ok(is.array(finishedJobs2), 'Job is in queue')
        t.equal(finishedJobs2[0].status, enums.status.completed, 'Job is completed')

        // ---------- Summary Tests ----------
        t.comment('queue: Summary')
        return qMain.summary()
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
        return qMain.reset()
      }).then((totalReset) => {
        t.ok(is.integer(totalReset), 'Queue reset returns integer')
        t.equal(totalReset, 2, 'Reset return value is valid')
        return qMain.summary()
      }).then((summary2) => {
        t.ok(is.object(summary2), 'Queue summary returns an object')
        t.equal(summary2.total, 0, 'Summary total is zero')

        // ---------- Stop Tests ----------
        t.comment('queue: Stop')
        return qMain.stop()
      }).then((stopped) => {
        t.ok(stopped, 'Queue stop returns true')
        return qMain.ready()
      }).then((ready) => {
        t.ok(is.false(ready), 'Queue ready returns false')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, qMain, state)

        // ---------- Drop Tests ----------
        t.comment('queue: Drop')
        qDrop = new Queue(tOpts.cxn(), tOpts.queueNameOnly(tableName))
      }).then(() => {
        return qDrop.drop()
      }).then((dropped) => {
        t.ok(dropped, 'Queue drop returns true')
        return qDrop.ready()
      }).then((ready) => {
        t.ok(is.false(ready), 'Queue ready returns false')

        // ---------- Multi Queue Tests ----------
        t.comment('queue: Multi-Queue')
        qSub = new Queue(tOpts.cxn(), tOpts.default(tableName))
        return qSub.ready()
      }).then((subReady) => {
        t.ok(subReady, `Subscriber queue ready [${qSub.id}]`)
        qPub = new Queue(tOpts.cxn(), tOpts.default(tableName))
        return qPub.ready()
      }).then((pubReady) => {
        t.ok(pubReady, `Publisher queue ready [${qPub.id}]`)
        qSub.process(processHandler)
        job = qPub.createJob()
        return qPub.addJob(job)
      }).then((jobOnQPub) => {
        t.equal(jobOnQPub[0].id, job.id, 'Job added to publisher queue')
      }).delay(1000).then(() => {
        return qSub.getJob(job.id)
      }).then((jobCheck) => {
        t.ok(is.array(jobCheck), 'Job is in queue')
        t.equal(jobCheck[0].status, enums.status.completed, 'Job is completed')
        return qSub.stop()
      }).delay(stopDelay).then(() => {
        t.pass('Subscriber Queue Stopped')
        return qPub.stop()
      }).delay(stopDelay).then(() => {
        t.pass('Publisher Queue Stopped')
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
