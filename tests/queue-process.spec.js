const test = require('tape')
const Promise = require('bluebird')
const enums = require('../src/enums')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const testOptions = require('./test-options')
const testData = require('./test-options').testData
const queueProcess = require('../src/queue-process')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-process test', (t) => {
      t.plan(4000000)

      // ---------- Test Setup ----------
      const q = testQueue(testOptions.queueMaster())
      q.on(enums.queueStatus.ready, function ready () {
        eventCount('Queue ready')
      })

      let jobs
      let eventTotal = 0
      let jobsCompletedTotal = 0
      let jobDelay = 200
      const eventMax = 4000000
      const noOfJobsToCreate = 10
      const allJobsDelay = jobDelay * (noOfJobsToCreate + 2)

      function eventCount (eventMessage) {
        eventTotal++

        if (eventTotal < eventMax) {
          t.pass(`Event: ${eventMessage} [${eventTotal}]`)
        }
        if (eventTotal >= eventMax) {
          Object.keys(enums.queueStatus).forEach((n) => {
            q.listeners(n).forEach((f) => q.removeListener(n, f))
          })
          resolve()
        }
      }

      function addEvents () {
        q.on(enums.queueStatus.review, function review (replaceCount) {
          eventCount(`Review Replaced: [${replaceCount}]`)
        })
        q.on(enums.queueStatus.reviewEnabled, function reviewEnabled () {
          eventCount('Review enabled')
        })
        q.on(enums.queueStatus.reviewDisabled, function reviewDisabled () {
          eventCount('Review disabled')
        })
        q.on(enums.queueStatus.paused, function paused () {
          eventCount('Queue paused')
        })
        q.on(enums.queueStatus.resumed, function resumed () {
          eventCount('Queue resumed')
        })
        q.on(enums.queueStatus.processing, function processing (jobId) {
          eventCount(`Queue processing [${jobId}]`)
        })
        q.on(enums.queueStatus.completed, function completed (jobId) {
          jobsCompletedTotal++
          eventCount(`Queue completed [${jobId}]`)
        })
        q.on(enums.queueStatus.idle, function idle () {
          eventCount(`Queue idle`)
        })
        q.on(enums.queueStatus.failed, function failed (jobId) {
          eventCount(`Queue failed [${jobId}]`)
        })
      }

      function testHandler (job, next) {
        t.pass(`Job Started: Delay: [${jobDelay}] ID: [${job.id}]`)
        setTimeout(function () {
          next(null, 'Job Completed: ' + job.id)
        }, jobDelay)
      }

      // ---------- Processing, Pause, and Concurrency Test ----------
      jobs = q.createJob(testData, null, noOfJobsToCreate)
      return q.ready.then(() => {
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        addEvents()
      //   q.paused = true
      //   return q.addJob(jobs)
      // }).then((savedJobs) => {
      //   t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
      //   q.concurrency = 1
      //   return queueProcess.addHandler(q, testHandler)
      // }).delay(jobDelay / 2).then(() => {
      //   t.equal(q.running, 0, 'Queue not processing jobs')
      //   q.paused = false
      //   return queueProcess.addHandler(q, testHandler).then(() => {
      //     t.fail('Calling queue-process twice should fail and is not')
      //   }).catch((err) => {
      //     t.equal(err.message, enums.error.processTwice, 'Calling queue-process twice returns rejected Promise')
      //   })
      // }).delay(jobDelay / 2).then(() => {
      //   q.pause()
      //   t.equal(q.running, q.concurrency, 'Queue is processing only one job')
      //   q.concurrency = 3
      // }).delay(jobDelay).then(() => {
      //   q.resume()
      // }).delay(jobDelay / 2).then(() => {
      //   t.equal(q.running, q.concurrency, 'Queue is processing max concurrent jobs')
      // }).delay(jobDelay * 8).then(() => {
      //   t.equal(jobsCompletedTotal, noOfJobsToCreate, `Queue has completed ${jobsCompletedTotal} jobs`)
      //   t.ok(q.idle, 'Queue is idle')
      //
      //   // ---------- Processing Restart on Job Add Test ----------
      //   jobs = q.createJob(testData, null, noOfJobsToCreate)
      //   q.concurrency = 10
      //   return q.addJob(jobs)
      // }).then((savedJobs) => {
      //   t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
      // }).delay(allJobsDelay).then(() => {
      //   t.equal(jobsCompletedTotal, noOfJobsToCreate * 2, `Queue has completed ${jobsCompletedTotal} jobs`)
      //   t.ok(q.idle, 'Queue is idle')
      //   q.pause()
      //
      //   // ---------- Processing Restart Test ----------
      //   jobs = q.createJob(testData, null, noOfJobsToCreate)
      //   return q.addJob(jobs)
      // }).then((savedJobs) => {
      //   t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
      //   q._paused = false
      //   return queueProcess.restart(q)
      // }).delay(allJobsDelay).then(() => {
      //   t.equal(jobsCompletedTotal, noOfJobsToCreate * 3, `Queue has completed ${jobsCompletedTotal} jobs`)
      //   t.pass('Restart processing succeeded')
      //   t.ok(q.idle, 'Queue is idle')

      // DELETE THE following
        return queueProcess.addHandler(q, testHandler)
      }).then(() => {


        // ---------- Processing with Job Timeout Test ----------
        jobs = q.createJob(testData)
        jobs.timeout = 1
        jobs.retryDelay = 3
        jobDelay = 2000
        return q.addJob(jobs)
      }).then((savedJobs) => {
        //console.dir(savedJobs)
        t.equal(savedJobs.length, 1, `Jobs saved successfully: [${savedJobs.length}]`)

        // q.paused = false
      //   return q.reset()
      // }).then((resetResult) => {
      //   t.ok(resetResult >= 0, 'Queue reset')
      //   resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
