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

      q.ready.then((ready) => {
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

        // ---------- Create Job Tests ----------
        t.comment('queue: Get Job')
        return q.getJob(savedJobs[0].id)
      }).then((savedJobs2) => {
        t.ok(is.array(savedJobs2), 'Get job returns an array')
        t.ok(is.job(savedJobs2[0]), 'Job retrieved successfully')
        t.equal(savedJobs2[0].id, job.id, 'Job id is valid')
        t.equal(savedJobs2[0].status, enums.status.added, 'Job status is valid')

        removeEventHandlers()
      }).catch(err => testError(err, module, t))

      // q.on('ready', () => {
      //   t.pass('Event: Queue ready')
      // })
      // q.on('added', (job) => {
      //   t.pass('Queue added event called')
      // })
      // q.on('processing', (processingValue) => {
      //   t.pass('Queue processing event called')
      // })
      // q.on('progress', (progressValue) => {
      //   t.pass('Queue progress event called')
      // })
      // q.on('idle', (jobId) => {
      //   t.pass('Queue idle event called')
      // })
      // q.on('success', (jobId) => {
      //   t.pass('Queue success event called')
      // })
      // q.on('failed', (jobId) => {
      //   t.pass('Queue failure event called')
      // })
      // // q.on('retry', (jobId) => {
      // //   t.pass('Queue retry event called')
      // // })
      // q.on('job failed', (jobId) => {
      //   console.log('job failed: ' + jobId)
      //   t.pass('Queue idle event called')
      // })
      //
      //
      // q.process((job, next) => {
      //   console.log('~~~~~~~~~~ process ~~~~~~~~~~')
      //   console.log(job.id)
      //   setTimeout(() => {
      //     console.log('~~~~~~~~~~ process finished ~~~~~~~~~~')
      //     next(null, 'Job Completed')
      //   }, 3000)
      // })
      //
      // let jobs = []
      // // console.dir(JSON.parse(JSON.stringify(q)))
      // // let ej = q.createJob()
      // // ej.id = 'ba3002c6-193f-4957-bc13-a4c3871629d7'
      // // // jobs.push(ej)
      // // for (let i = 0; i < 4; i++) {
      //   jobs.push(q.createJob({foo: 1}))
      // // }
      //
      // q.addJob(jobs).then((result) => {
      //   console.log('~~~~~~~~~~ addJob result ~~~~~~~~~~')
      //   console.dir(JSON.parse(JSON.stringify(result)))
      // }).then(() => {
      //   return q.summary()
      // }).then((d) => {
      //   console.log('~~~~~~~~~~ summary ~~~~~~~~~~')
      //   console.dir(d)
      // }).then(() => {
      //   return q.drop(4000)
      // }).then((removeResult) => {
      //   console.log('~~~~~~~~~~ removeResult ~~~~~~~~~~')
      //   console.dir(removeResult)
      // }).catch(err => testError(err, module, t))
      //
      // q.jobOptions = customjobOptions
      // t.deepEqual(q.jobOptions, customjobOptions, 'Set default job options')
    })
  })
}
