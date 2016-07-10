const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const enums = require('../src/enums')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const testOptions = require('./test-options')
const testData = require('./test-options').testData
const queueProcess = require('../src/queue-process')
const dbReview = require('../src/db-review')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-process', (t) => {
      t.plan(154)

      // ---------- Test Setup ----------
      const q = testQueue(testOptions.queueMaster())
      q.on(enums.status.ready, function ready () {
        t.pass('Queue ready')
        dbReview.disable(q)
      })

      let jobs
      let jobDelay = 200
      const noOfJobsToCreate = 10
      const allJobsDelay = jobDelay * (noOfJobsToCreate + 2)

      let ec = {
        review: 0,
        paused: 0,
        resumed: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        idle: 0,
        failed: 0,
        terminated: 0
      }
      function addEvents () {
        q.on(enums.status.review, function review (replaceCount) {
          ec.review++
          t.pass(`Event: Review Replaced [${ec.review}] [${replaceCount}]`)
        })
        q.on(enums.status.paused, function paused () {
          ec.paused++
          t.pass(`Event: Queue paused [${ec.paused}]`)
        })
        q.on(enums.status.resumed, function resumed () {
          ec.resumed++
          t.pass(`Event: Queue resumed [${ec.resumed}]`)
        })
        q.on(enums.status.processing, function processing (jobId) {
          ec.processing++
          t.ok(is.uuid(jobId),
            `Event: Queue processing [${ec.processing}] [${jobId}]`)
        })
        q.on(enums.status.completed, function completed (jobId) {
          ec.completed++
          t.ok(is.uuid(jobId),
            `Event: Queue completed [${ec.completed}] [${jobId}]`)
        })
        q.on(enums.status.cancelled, function cancelled (jobId) {
          ec.cancelled++
          t.ok(is.uuid(jobId),
            `Event: Queue cancelled [${ec.cancelled}] [${jobId}]`)
        })
        q.on(enums.status.idle, function idle () {
          ec.idle++
          if (ec.idle < 8) {
            t.pass(`Event: Queue idle [${ec.idle}]`)
          }
        })
        q.on(enums.status.failed, function failed (jobId) {
          ec.failed++
          t.ok(is.uuid(jobId),
            `Event: Queue failed [${ec.failed}] [${jobId}]`)
        })
        q.on(enums.status.terminated, function terminated (jobId) {
          ec.terminated++
          t.ok(is.uuid(jobId),
            `Event: Queue terminated [${ec.terminated}] [${jobId}]`)
        })
      }

      let testTimes = false
      let tryCount = 0
      let testCancel = false
      function testHandler (job, next) {
        if (testTimes) {
          const testDate = moment().add(
            1 + job.timeout + (job.retryCount * job.retryDelay),
            'seconds')
          t.ok(moment(job.dateRetry).isBefore(testDate, 'seconds'), 'Job dateRetry is valid')
          tryCount++
        }
        t.pass(`Job Started: Delay: [${jobDelay}] ID: [${job.id}]`)
        if (testCancel) {
          const cancelErr = new Error(testData)
          cancelErr.cancelJob = true
          cancelErr.cancelReason = testData
          next(cancelErr)
        } else {
          setTimeout(function () {
            next(null, 'Job Completed: ' + job.id)
          }, jobDelay)
        }
      }

      // ---------- Test Setup ----------
      jobs = q.createJob(testData, noOfJobsToCreate)
      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        q.pause()
        addEvents()

        // ---------- Processing, Pause, and Concurrency Test ----------
        t.comment('queue-process: Process, Pause, and Concurrency')
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
        q.concurrency = 1
        return queueProcess.addHandler(q, testHandler)
      }).delay(jobDelay / 2).then(() => {
        t.equal(q.running, 0, 'Queue not processing jobs')
        return q.resume()
      }).then(() => {
        return queueProcess.addHandler(q, testHandler).then(() => {
          t.fail('Calling queue-process twice should fail and is not')
        }).catch((err) => {
          t.equal(err.message, enums.error.processTwice, 'Calling queue-process twice returns rejected Promise')
        })
      }).delay(jobDelay / 2).then(() => {
        q.pause()
        t.equal(q.running, q.concurrency, 'Queue is processing only one job')
        q.concurrency = 3
      }).delay(jobDelay).then(() => {
        q.resume()
      }).delay(jobDelay / 2).then(() => {
        t.equal(q.running, q.concurrency, 'Queue is processing max concurrent jobs')
      }).delay(jobDelay * 8).then(() => {
        t.equal(ec.completed, noOfJobsToCreate, `Queue has completed ${ec.completed} jobs`)
        t.ok(q.idle, 'Queue is idle')

        // ---------- Processing Restart on Job Add Test ----------
        t.comment('queue-process: Process Restart on Job Add')
        jobs = q.createJob(testData, noOfJobsToCreate)
        q.concurrency = 10
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
      }).delay(allJobsDelay).then(() => {
        t.equal(ec.completed, noOfJobsToCreate * 2, `Queue has completed ${ec.completed} jobs`)
        t.ok(q.idle, 'Queue is idle')
        q.pause()

        // ---------- Processing Restart Test ----------
        t.comment('queue-process: Process Restart')
        jobs = q.createJob(testData, noOfJobsToCreate)
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
        q._paused = false
        return queueProcess.restart(q)
      }).delay(allJobsDelay).then(() => {
        t.equal(ec.completed, noOfJobsToCreate * 3, `Queue has completed ${ec.completed} jobs`)
        t.pass('Restart processing succeeded')
        t.ok(q.idle, 'Queue is idle')

        // ---------- Processing with Job Timeout Test ----------
        t.comment('queue-process: Processing with Job Timeout')
        jobs = q.createJob(testData)
        jobs.timeout = 1
        jobs.retryDelay = 2
        jobDelay = 1500
        testTimes = true // Enables handler time testing
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 1, `Jobs saved successfully: [${savedJobs.length}]`)
      }).delay(5200).then(() => {
        dbReview.runOnce(q)
      }).delay(5200).then(() => {
        dbReview.runOnce(q)
      }).delay(3200).then(() => {
        jobDelay = 200
        testTimes = false
        t.equal(tryCount, 4, 'Job failed and retried correctly')
      }).then(() => {
        jobs = q.createJob(testData)

        // ---------- Processing with Cancel Test ----------
        t.comment('queue-process: Processing with Cancel')
        testCancel = true
        return q.addJob(jobs)
      }).delay(1000).then(() => {
        return q.getJob(jobs)
      }).then((cancelledJob) => {
        t.equal(cancelledJob[0].status, enums.status.cancelled, 'Job is cancelled')
        return q.summary()
      }).then((queueSummary) => {
        t.equal(ec.review, 2, 'Review event raised correct number of times')
        t.equal(ec.paused, 2, 'Paused event raised correct number of times')
        t.equal(ec.resumed, 2, 'Resumed event raised correct number of times')
        t.equal(ec.processing, 35, 'Processing event raised correct number of times')
        t.equal(ec.completed, 30, 'Completed event raised correct number of times')
        t.equal(ec.cancelled, 1, 'Cancelled event raised')
        t.equal(ec.idle, 7, 'idle event raised correct number of times')
        t.equal(ec.failed, 3, 'failed event raised correct number of times')
        t.equal(ec.terminated, 1, 'terminated event raised correct number of times')
        t.equal(queueSummary.completed, 30, 'Summary 30 jobs completed')
        t.equal(queueSummary.cancelled, 1, 'Summary 1 job cancelled')
        t.equal(queueSummary.terminated, 1, 'Summary 1 job terminated')

        // ---------- Test Cleanup ----------
        Object.keys(enums.status).forEach((n) => {
          q.listeners(n).forEach((f) => q.removeListener(n, f))
        })
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
