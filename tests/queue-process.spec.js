const test = require('tap').test
const Promise = require('bluebird')
const datetime = require('../src/datetime')
const is = require('../src/is')
const enums = require('../src/enums')
const tError = require('./test-error')
const tOpts = require('./test-options')
const tData = require('./test-options').tData
const queueProcess = require('../src/queue-process')
const dbReview = require('../src/db-review')
const Queue = require('../src/queue')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-process'

module.exports = function () {
  return new Promise((resolve, reject) => {
    test(testName, { timeout: 60000 }, (t) => {
      t.plan(294)

      // ---------- Test Setup ----------
      const q = new Queue(tOpts.cxn(), tOpts.default())
      let qGlobalCancel

      let jobs
      let jobDelay = 200
      const noOfJobsToCreate = 10
      const allJobsDelay = jobDelay * (noOfJobsToCreate + 2)

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 38,
        progress: 1,
        pausing: 2,
        paused: 2,
        resumed: 3,
        removed: 0,
        idle: 12,
        reset: 0,
        error: 0,
        reviewed: 3,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 35,
        waiting: 0,
        active: 38,
        completed: 32,
        cancelled: 2,
        failed: 3,
        terminated: 1,
        reanimated: 0,
        log: 0,
        updated: 0
      }

      // idle event testing is not part of the test-event-handlers module
      // because it is too difficult to measure. This handler and one
      // test below is to ensure idle is being called.
      function idleEventHandler (qid) {
        t.ok(is.string(qid), `Event: idle`)
      }

      let completedEventCount = 0
      const summaryCompleted = 32
      const summaryCancelled = 2
      const summaryTerminated = 1

      let testTimes = false
      let tryCount = 0
      let updateProgress = false
      let testCancel = false
      let jobProcessTimeoutId = false

      function testHandler (job, next, onCancel) {
        if (testTimes) {
          const testDate = datetime.add.ms(new Date(),
            1000 + job.timeout + (job.retryCount * job.retryDelay))
          t.ok(is.dateBefore(job.dateEnable, testDate), 'Job dateEnable is valid')
          tryCount++
        }

        t.pass(`Job Started: Delay: [${jobDelay}] ID: [${job.id}]`)
        if (testCancel) {
          const cancelErr = new Error(tData)
          cancelErr.cancelJob = tData
          next(cancelErr)
        } else {
          if (updateProgress) {
            setTimeout(function () {
              return job.updateProgress(50).then((result) => {
                t.ok(result, 'Job progress updated: ' + job.id)
              })
            }, jobDelay / 2)
          }

          jobProcessTimeoutId = setTimeout(function () {
            jobProcessTimeoutId = false
            next('Job Completed: ' + job.id)
            .then((runningJobs) => {
              t.ok(is.integer(runningJobs), `Next call returns running jobs [${runningJobs}]`)
            })
          }, jobDelay)

          return onCancel(job, () => {
            clearTimeout(jobProcessTimeoutId)
            jobProcessTimeoutId = false
            t.pass('onCancel invoked')
            return
          })
        }
      }

      // ---------- Test Setup ----------
      jobs = []
      for (let i = 0; i < noOfJobsToCreate; i++) {
        jobs.push(q.createJob())
      }
      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.pause()
      }).then(() => {
        eventHandlers.add(t, q, state)

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
        q.on(enums.status.idle, idleEventHandler)
        return q.resume()
      }).delay(jobDelay / 2).then(() => {
        t.equal(q._running, q._concurrency, 'Queue is processing max concurrent jobs')
      }).delay(jobDelay * 8).then(() => {
        q.removeListener(enums.status.idle, idleEventHandler)
        completedEventCount = state.count.get(enums.status.completed)
        t.equal(state.count.get(enums.status.completed), noOfJobsToCreate, `Queue has completed ${completedEventCount} jobs`)
        t.ok(q.idle, 'Queue is idle')

        // ---------- Processing Restart on Job Add Test ----------
        t.comment('queue-process: Process Restart on Job Add')
        jobs = []
        for (let i = 0; i < noOfJobsToCreate; i++) {
          jobs.push(q.createJob())
        }
        q._concurrency = 10
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
      }).delay(allJobsDelay).then(() => {
        completedEventCount = state.count.get(enums.status.completed)
        t.equal(completedEventCount, noOfJobsToCreate * 2, `Queue has completed ${completedEventCount} jobs`)
        t.ok(q.idle, 'Queue is idle')
        return q.pause()
      }).then(() => {
        //
        // ---------- Processing Restart Test ----------
        t.comment('queue-process: Process Restart')
        jobs = []
        for (let i = 0; i < noOfJobsToCreate; i++) {
          jobs.push(q.createJob())
        }
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
        return q.resume()
      }).then(() => {
        return queueProcess.restart(q)
      }).delay(allJobsDelay).then(() => {
        completedEventCount = state.count.get(enums.status.completed)
        t.equal(completedEventCount, noOfJobsToCreate * 3, `Queue has completed ${completedEventCount} jobs`)
        t.pass('Restart processing succeeded')
        t.ok(q.idle, 'Queue is idle')

        // ---------- Processing with Job Timeout Test ----------
        t.comment('queue-process: Processing with Job Timeout')
        jobs = q.createJob()
        jobs.timeout = 1000
        jobs.retryDelay = 2000
        jobDelay = 1500
        testTimes = true // Enables handler time testing
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 1, `Jobs saved successfully: [${savedJobs.length}]`)
      }).delay(5200).then(() => {
        return dbReview.runOnce(q)
      }).delay(5200).then(() => {
        return dbReview.runOnce(q)
      }).delay(3200).then(() => {
        jobDelay = 200
        testTimes = false
        t.equal(tryCount, 4, 'Job failed and retried correctly')
      }).then(() => {
        jobs = q.createJob()

        // ---------- Processing with Job Timeout Extended Test ----------
        t.comment('queue-process: Processing with Job Timeout Extended')
        jobs = q.createJob()
        jobs.timeout = 1000
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
        testCancel = true

        // ---------- Processing with Cancel Test ----------
        t.comment('queue-process: Processing with Cancel')
        jobs = q.createJob()
        return q.addJob(jobs)
      }).delay(1000).then(() => {
        return q.getJob(jobs)
      }).then((cancelledJob) => {
        t.equal(cancelledJob[0].status, enums.status.cancelled, 'Job is cancelled')
      }).then(() => {
        testCancel = false

        // ---------- Processing with Global Cancel Test ----------
        t.comment('queue-process: Processing with Global Cancel')
        qGlobalCancel = new Queue(tOpts.cxn(), tOpts.default())
        jobDelay = 10000
        jobs = q.createJob()
        return q.addJob(jobs)
      }).delay(1000).then(() => {
        return q.getJob(jobs)
      }).then((globalCancelJobs1) => {
        t.equal(globalCancelJobs1[0].status, enums.status.active, 'Job status is active')
        t.ok(jobProcessTimeoutId, 'Job is being processed')
        return qGlobalCancel.cancelJob(globalCancelJobs1[0])
      }).delay(1000).then(() => {
        return q.getJob(jobs)
      }).then((globalCancelJobs2) => {
        t.equal(globalCancelJobs2[0].status, enums.status.cancelled, 'Job status is cancelled')
        t.notOk(jobProcessTimeoutId, 'Job processing has been stopped')
        jobDelay = 200
        return qGlobalCancel.stop()
      }).then(() => {
        //
        // ---------- Delayed Job Start Test ----------
        t.comment('queue-process: Delayed Job Start')
        jobs = q.createJob()
        jobs.dateEnable = datetime.add.sec(new Date(), 2)
        return q.addJob(jobs)
      }).delay(500).then(() => {
        return queueProcess.restart(q)
      }).delay(500).then(() => {
        return q.getJob(jobs)
      }).then((delayedJobs) => {
        t.equal(delayedJobs[0].status, enums.status.waiting, 'Delayed job has status: added')
      }).delay(2000).then(() => {
        return queueProcess.restart(q)
      }).delay(1000).then(() => {
        return q.getJob(jobs)
      }).then((delayedJobs3) => {
        t.equal(delayedJobs3[0].status, enums.status.completed, 'Delayed job has status: completed')

        // ---------- Queue Summary ----------
        t.comment('queue-process: Queue Summary')
        return q.summary()
      }).then((queueSummary) => {
        t.equal(queueSummary.completed, summaryCompleted, `Summary ${summaryCompleted} jobs completed`)
        t.equal(queueSummary.cancelled, summaryCancelled, `Summary ${summaryCancelled} job cancelled`)
        t.equal(queueSummary.terminated, summaryTerminated, `Summary ${summaryTerminated} job terminated`)

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)

        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
