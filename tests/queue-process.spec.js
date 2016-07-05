const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const enums = require('../src/enums')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const testOptions = require('./test-options')
const testData = require('./test-options').testData
const queueProcess = require('../src/queue-process')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-process test', (t) => {
      t.plan(153)

      // ---------- Test Setup ----------
      const q = testQueue(testOptions.queueMaster())
      q.on(enums.status.ready, function ready () {
        t.pass('Queue ready')
      })

      let jobs
      let jobsCompletedTotal = 0
      let jobDelay = 200
      const noOfJobsToCreate = 10
      const allJobsDelay = jobDelay * (noOfJobsToCreate + 2)

      let events = true
      function addEvents () {
        q.on(enums.status.review, function review (replaceCount) {
          if (events) { t.pass(`Review Replaced: [${replaceCount}]`) }
        })
        q.on(enums.status.reviewEnabled, function reviewEnabled () {
          if (events) { t.pass('Review enabled') }
        })
        q.on(enums.status.reviewDisabled, function reviewDisabled () {
          if (events) { t.pass('Review disabled') }
        })
        q.on(enums.status.paused, function paused () {
          if (events) { t.pass('Queue paused') }
        })
        q.on(enums.status.resumed, function resumed () {
          if (events) { t.pass('Queue resumed') }
        })
        q.on(enums.status.processing, function processing (jobId) {
          if (events) { t.pass(`Queue processing [${jobId}]`) }
        })
        q.on(enums.status.completed, function completed (jobId) {
          jobsCompletedTotal++
          if (events) { t.pass(`Queue completed [${jobId}]`) }
        })
        q.on(enums.status.cancelled, function cancelled (jobId) {
          if (events) { t.pass(`Queue cancelled [${jobId}]`) }
        })
        q.on(enums.status.idle, function idle () {
          if (events) { t.pass(`Queue idle`) }
        })
        q.on(enums.status.failed, function failed (jobId) {
          if (events) { t.pass(`Queue failed [${jobId}]`) }
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
      jobs = q.createJob(testData, null, noOfJobsToCreate)
      return q.ready.then(() => {
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        addEvents()
        q.paused = true

        // ---------- Processing, Pause, and Concurrency Test ----------
        t.comment('queue-process: Process, Pause, and Concurrency')
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
        q.concurrency = 1
        return queueProcess.addHandler(q, testHandler)
      }).delay(jobDelay / 2).then(() => {
        t.equal(q.running, 0, 'Queue not processing jobs')
        q.paused = false
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
        t.equal(jobsCompletedTotal, noOfJobsToCreate, `Queue has completed ${jobsCompletedTotal} jobs`)
        t.ok(q.idle, 'Queue is idle')

        // ---------- Processing Restart on Job Add Test ----------
        t.comment('queue-process: Process Restart on Job Add')
        jobs = q.createJob(testData, null, noOfJobsToCreate)
        q.concurrency = 10
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
      }).delay(allJobsDelay).then(() => {
        t.equal(jobsCompletedTotal, noOfJobsToCreate * 2, `Queue has completed ${jobsCompletedTotal} jobs`)
        t.ok(q.idle, 'Queue is idle')
        q.pause()

        // ---------- Processing Restart Test ----------
        t.comment('queue-process: Process Restart')
        jobs = q.createJob(testData, null, noOfJobsToCreate)
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
        q._paused = false
        return queueProcess.restart(q)
      }).delay(allJobsDelay).then(() => {
        t.equal(jobsCompletedTotal, noOfJobsToCreate * 3, `Queue has completed ${jobsCompletedTotal} jobs`)
        t.pass('Restart processing succeeded')
        t.ok(q.idle, 'Queue is idle')

      // DELETE THE following
      //   return queueProcess.addHandler(q, testHandler)
      // }).then(() => {

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
      }).delay(18000).then(() => {
        jobDelay = 200
        testTimes = false
        t.equal(tryCount, 4, 'Job failed and retried correctly')
        return q.review('disable')
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
        t.equal(queueSummary.completed, 30, 'Summary 30 jobs completed')
        t.equal(queueSummary.cancelled, 1, 'Summary 1 job cancelled')
        t.equal(queueSummary.failed, 1, 'Summary 1 job failed')

        // ---------- Test Cleanup ----------
        events = false
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
