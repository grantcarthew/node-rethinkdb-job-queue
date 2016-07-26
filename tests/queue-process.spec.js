const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const enums = require('../src/enums')
const testError = require('./test-error')
const testOptions = require('./test-options')
const testData = require('./test-options').testData
const queueProcess = require('../src/queue-process')
const dbReview = require('../src/db-review')
const Queue = require('../src/queue')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-process', (t) => {
      t.plan(186)

      // ---------- Test Setup ----------
      const q = new Queue(testOptions.queueMaster())
      dbReview.disable(q)

      let jobs
      let jobDelay = 200
      let completedEventCounter = 0
      const noOfJobsToCreate = 10
      const allJobsDelay = jobDelay * (noOfJobsToCreate + 2)

      let testEvents = false
      function readyEventHandler (qid) {
        if (testEvents) {
          t.pass(`Queue ready [${qid}]`)
        }
      }
      function reviewEventHandler (replaceCount) {
        if (testEvents) {
          t.pass(`Event: Review Replaced [${replaceCount}]`)
        }
      }
      function pausedEventHandler (qid) {
        if (testEvents) {
          t.pass(`Event: Queue paused [${qid}]`)
        }
      }
      function resumedEventHandler (qid) {
        if (testEvents) {
          t.pass(`Event: Queue resumed [${qid}]`)
        }
      }
      function processingEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId),
            `Event: Queue processing [${jobId}]`)
        }
      }
      function completedEventHandler (jobId) {
        if (testEvents) {
          completedEventCounter++
          t.ok(is.uuid(jobId),
            `Event: Queue completed [${completedEventCounter}] [${jobId}]`)
        }
      }
      function cancelledEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId),
            `Event: Queue cancelled [${jobId}]`)
        }
      }
      function idleEventHandler (qid) {
        if (testEvents) {
          t.pass(`Event: Queue idle [${qid}]`)
        }
      }
      function failedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId),
            `Event: Queue failed [${jobId}]`)
        }
      }
      function terminatedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId),
            `Event: Queue terminated [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.ready, readyEventHandler)
        q.on(enums.status.review, reviewEventHandler)
        q.on(enums.status.paused, pausedEventHandler)
        q.on(enums.status.resumed, resumedEventHandler)
        q.on(enums.status.processing, processingEventHandler)
        q.on(enums.status.completed, completedEventHandler)
        q.on(enums.status.cancelled, cancelledEventHandler)
        q.on(enums.status.idle, idleEventHandler)
        q.on(enums.status.failed, failedEventHandler)
        q.on(enums.status.terminated, terminatedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.ready, readyEventHandler)
        q.removeListener(enums.status.review, reviewEventHandler)
        q.removeListener(enums.status.paused, pausedEventHandler)
        q.removeListener(enums.status.resumed, resumedEventHandler)
        q.removeListener(enums.status.processing, processingEventHandler)
        q.removeListener(enums.status.completed, completedEventHandler)
        q.removeListener(enums.status.cancelled, cancelledEventHandler)
        q.removeListener(enums.status.idle, idleEventHandler)
        q.removeListener(enums.status.failed, failedEventHandler)
        q.removeListener(enums.status.terminated, terminatedEventHandler)
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
            .then((runningJobs) => {
              t.ok(is.integer(runningJobs), `Next call returns running jobs [${runningJobs}]`)
            })
          }, jobDelay)
        }
      }

      // ---------- Test Setup ----------
      jobs = q.createJob(testData, noOfJobsToCreate)
      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.pause()
      }).then(() => {
        addEventHandlers()

        // ---------- Processing, Pause, and Concurrency Test ----------
        t.comment('queue-process: Process, Pause, and Concurrency')
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
        q._concurrency = 1
        return queueProcess.addHandler(q, testHandler)
      }).delay(jobDelay / 2).then(() => {
        t.equal(q._running, 0, 'Queue not processing jobs')
        return q.resume()
      }).then(() => {
        return queueProcess.addHandler(q, testHandler).then(() => {
          t.fail('Calling queue-process twice should fail and is not')
        }).catch((err) => {
          t.equal(err.message, enums.message.processTwice, 'Calling queue-process twice returns rejected Promise')
        })
      }).delay(jobDelay / 2).then(() => {
        t.equal(q._running, q._concurrency, 'Queue is processing only one job')
        q._concurrency = 3
        return q.pause()
      }).then(() => {
        return q.resume()
      }).delay(jobDelay / 2).then(() => {
        t.equal(q._running, q._concurrency, 'Queue is processing max concurrent jobs')
      }).delay(jobDelay * 8).then(() => {
        t.equal(completedEventCounter, noOfJobsToCreate, `Queue has completed ${completedEventCounter} jobs`)
        t.ok(q.idle, 'Queue is idle')

        // ---------- Processing Restart on Job Add Test ----------
        t.comment('queue-process: Process Restart on Job Add')
        jobs = q.createJob(testData, noOfJobsToCreate)
        q._concurrency = 10
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
      }).delay(allJobsDelay).then(() => {
        t.equal(completedEventCounter, noOfJobsToCreate * 2, `Queue has completed ${completedEventCounter} jobs`)
        t.ok(q.idle, 'Queue is idle')
        return q.pause()
      }).then(() => {
        //
        // ---------- Processing Restart Test ----------
        t.comment('queue-process: Process Restart')
        jobs = q.createJob(testData, noOfJobsToCreate)
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
        return q.resume()
      }).then(() => {
        return queueProcess.restart(q)
      }).delay(allJobsDelay).then(() => {
        t.equal(completedEventCounter, noOfJobsToCreate * 3, `Queue has completed ${completedEventCounter} jobs`)
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
        t.equal(queueSummary.completed, 30, 'Summary 30 jobs completed')
        t.equal(queueSummary.cancelled, 1, 'Summary 1 job cancelled')
        t.equal(queueSummary.terminated, 1, 'Summary 1 job terminated')

        // ---------- Test Cleanup ----------
        removeEventHandlers()
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
