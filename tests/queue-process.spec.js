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
      t.plan(207)

      // ---------- Test Setup ----------
      const q = new Queue(testOptions.master(5))
      dbReview.disable(q)

      let jobs
      let jobDelay = 200
      const noOfJobsToCreate = 10
      const allJobsDelay = jobDelay * (noOfJobsToCreate + 2)

      let testEvents = false
      let reviewedEventCount = 0
      const reviewedEventTotal = 7
      function reviewedEventHandler (replaceCount) {
        if (testEvents) {
          reviewedEventCount++
          t.pass(`Event: reviewed [${reviewedEventCount} of ${reviewedEventTotal}] [${replaceCount}]`)
        }
      }
      let pausedEventCount = 0
      const pausedEventTotal = 2
      function pausedEventHandler (qid) {
        if (testEvents) {
          pausedEventCount++
          t.pass(`Event: paused [${pausedEventCount} of ${pausedEventTotal}] [${qid}]`)
        }
      }
      let resumedEventCount = 0
      const resumedEventTotal = 3
      function resumedEventHandler (qid) {
        if (testEvents) {
          resumedEventCount++
          t.pass(`Event: resumed [${resumedEventCount} of ${resumedEventTotal}] [${qid}]`)
        }
      }
      let processingEventCount = 0
      const processingEventTotal = 36
      function processingEventHandler (jobId) {
        if (testEvents) {
          processingEventCount++
          t.ok(is.uuid(jobId),
            `Event: processing [${processingEventCount} of ${processingEventTotal}] [${jobId}]`)
        }
      }
      let progressEventCount = 0
      const progressEventTotal = 1
      function progressEventHandler (jobId, percent) {
        if (testEvents) {
          progressEventCount++
          t.ok(is.uuid(jobId),
            `Event: progress ${percent} [${progressEventCount} of ${progressEventTotal}] [${jobId}]`)
        }
      }
      let completedEventCount = 0
      const completedEventTotal = 31
      function completedEventHandler (jobId) {
        if (testEvents) {
          completedEventCount++
          t.ok(is.uuid(jobId),
            `Event: completed [${completedEventCount} of ${completedEventTotal}] [${jobId}]`)
        }
      }
      let cancelledEventCount = 0
      const cancelledEventTotal = 1
      function cancelledEventHandler (jobId) {
        if (testEvents) {
          cancelledEventCount++
          t.ok(is.uuid(jobId),
            `Event: cancelled [${cancelledEventCount} of ${cancelledEventTotal}] [${jobId}]`)
        }
      }
      let idleEventCount = 0
      const idleEventTotal = 12
      function idleEventHandler (qid) {
        if (testEvents) {
          idleEventCount++
          t.pass(`Event: idle [${idleEventCount} of ${idleEventTotal}] [${qid}]`)
        }
      }
      let failedEventCount = 0
      const failedEventTotal = 3
      function failedEventHandler (jobId) {
        if (testEvents) {
          failedEventCount++
          t.ok(is.uuid(jobId),
            `Event: failed [${failedEventCount} of ${failedEventTotal}] [${jobId}]`)
        }
      }
      let terminatedEventCount = 0
      const terminatedEventTotal = 1
      function terminatedEventHandler (jobId) {
        if (testEvents) {
          terminatedEventCount++
          t.ok(is.uuid(jobId),
            `Event: terminated [${terminatedEventCount} of ${terminatedEventTotal}] [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.reviewed, reviewedEventHandler)
        q.on(enums.status.paused, pausedEventHandler)
        q.on(enums.status.resumed, resumedEventHandler)
        q.on(enums.status.processing, processingEventHandler)
        q.on(enums.status.progress, progressEventHandler)
        q.on(enums.status.completed, completedEventHandler)
        q.on(enums.status.cancelled, cancelledEventHandler)
        q.on(enums.status.idle, idleEventHandler)
        q.on(enums.status.failed, failedEventHandler)
        q.on(enums.status.terminated, terminatedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.reviewed, reviewedEventHandler)
        q.removeListener(enums.status.paused, pausedEventHandler)
        q.removeListener(enums.status.resumed, resumedEventHandler)
        q.removeListener(enums.status.processing, processingEventHandler)
        q.removeListener(enums.status.processing, progressEventHandler)
        q.removeListener(enums.status.completed, completedEventHandler)
        q.removeListener(enums.status.cancelled, cancelledEventHandler)
        q.removeListener(enums.status.idle, idleEventHandler)
        q.removeListener(enums.status.failed, failedEventHandler)
        q.removeListener(enums.status.terminated, terminatedEventHandler)
      }

      let testTimes = false
      let tryCount = 0
      let updateProgress = false
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
          cancelErr.cancelJob = testData
          next(cancelErr)
        } else {
          if (updateProgress) {
            setTimeout(function () {
              return job.setProgress(50).then((result) => {
                t.ok(result, 'Job progress updated: ' + job.id)
              })
            }, jobDelay / 2)
          }

          setTimeout(function () {
            next(null, 'Job Completed: ' + job.id)
            .then((runningJobs) => {
              t.ok(is.integer(runningJobs), `Next call returns running jobs [${runningJobs}]`)
            })
          }, jobDelay)
        }
      }

      // ---------- Test Setup ----------
      jobs = q.createJob(noOfJobsToCreate).map(j => j)
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
        t.equal(completedEventCount, noOfJobsToCreate, `Queue has completed ${completedEventCount} jobs`)
        t.ok(q.idle, 'Queue is idle')

        // ---------- Processing Restart on Job Add Test ----------
        t.comment('queue-process: Process Restart on Job Add')
        jobs = q.createJob(noOfJobsToCreate).map(j => j)
        q._concurrency = 10
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
      }).delay(allJobsDelay).then(() => {
        t.equal(completedEventCount, noOfJobsToCreate * 2, `Queue has completed ${completedEventCount} jobs`)
        t.ok(q.idle, 'Queue is idle')
        return q.pause()
      }).then(() => {
        //
        // ---------- Processing Restart Test ----------
        t.comment('queue-process: Process Restart')
        jobs = q.createJob(noOfJobsToCreate).map(j => j)
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
        return q.resume()
      }).then(() => {
        return queueProcess.restart(q)
      }).delay(allJobsDelay).then(() => {
        t.equal(completedEventCount, noOfJobsToCreate * 3, `Queue has completed ${completedEventCount} jobs`)
        t.pass('Restart processing succeeded')
        t.ok(q.idle, 'Queue is idle')

        // ---------- Processing with Job Timeout Test ----------
        t.comment('queue-process: Processing with Job Timeout')
        jobs = q.createJob()
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
        jobs = q.createJob()

        // ---------- Processing with Job Timeout Extended Test ----------
        t.comment('queue-process: Processing with Job Timeout Extended')
        jobs = q.createJob()
        jobs.timeout = 1
        jobs.retryMax = 0
        jobDelay = 1500
        testTimes = true // Enables handler time testing
        updateProgress = true // Enables the handler job progress updates
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 1, `Jobs saved successfully: [${savedJobs.length}]`)
      }).delay(5200).then(() => {
        jobDelay = 200
        testTimes = false
        updateProgress = false
        // t.equal(tryCount, 4, 'Job failed and retried correctly')
      }).then(() => {
        jobs = q.createJob()

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
        t.equal(queueSummary.completed, 31, 'Summary 31 jobs completed')
        t.equal(queueSummary.cancelled, 1, 'Summary 1 job cancelled')
        t.equal(queueSummary.terminated, 1, 'Summary 1 job terminated')

        // ---------- Test Cleanup ----------
        removeEventHandlers()

        // ---------- Event Summary ----------
        t.comment('queue-process: Event Summary')
        t.equal(reviewedEventCount, reviewedEventTotal, `Total reviewed events: [${reviewedEventTotal}]`)
        t.equal(pausedEventCount, pausedEventTotal, `Total paused events: [${pausedEventTotal}]`)
        t.equal(resumedEventCount, resumedEventTotal, `Total resumed events: [${resumedEventTotal}]`)
        t.equal(processingEventCount, processingEventTotal, `Total processing events: [${processingEventTotal}]`)
        t.equal(progressEventCount, progressEventTotal, `Total progress events: [${progressEventTotal}]`)
        t.equal(completedEventCount, completedEventTotal, `Total completed events: [${completedEventTotal}]`)
        t.equal(cancelledEventCount, cancelledEventTotal, `Total cancelled events: [${cancelledEventTotal}]`)
        t.equal(idleEventCount, idleEventTotal, `Total idle events: [${idleEventTotal}]`)
        t.equal(failedEventCount, failedEventTotal, `Total failed events: [${failedEventTotal}]`)
        t.equal(terminatedEventCount, terminatedEventTotal, `Total terminated events: [${terminatedEventTotal}]`)

        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        return resolve(t.end())
      }).catch(err => testError(err, module, t))
    })
  })
}
