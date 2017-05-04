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

queueProcessTests()
function queueProcessTests () {
  return new Promise((resolve, reject) => {
    test(testName, { timeout: 200000000 }, (t) => {
      t.plan(429)

      // ---------- Test Setup ----------
      const tableName = 'queueProcess'
      const q = new Queue(tOpts.cxn(), tOpts.default(tableName))
      let qGlobalCancel

      let jobs
      let jobDelay = 200
      let repeatDelay = 300
      const noOfJobsToCreate = 10
      const allJobsDelay = jobDelay * (noOfJobsToCreate + 2)

      function resumeProcessPauseGet () {
        return q.resume().delay(jobDelay * 0.8).then(() => {
          return q.pause()
        }).delay(jobDelay * 2).then(() => {
          return q.getJob(jobs)
        }).delay(repeatDelay * 2)
      }

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 51,
        progress: 1,
        pausing: 14,
        paused: 14,
        resumed: 14,
        removed: 1,
        idle: 12,
        reset: 0,
        error: 0,
        reviewed: 3,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 39,
        waiting: 0,
        active: 51,
        completed: 42,
        cancelled: 3,
        failed: 5,
        terminated: 1,
        reanimated: 0,
        log: 0,
        updated: 1
      }

      // idle event testing is not part of the test-event-handlers module
      // because it is too difficult to measure. This handler and one
      // test below is to ensure idle is being called.
      function idleEventHandler (qid) {
        t.ok(is.string(qid), `Event: idle`)
      }

      const summaryCompleted = 33
      const summaryCancelled = 3
      const summaryTerminated = 1

      let testTimes = false
      let tryCount = 0
      let updateProgress = false
      let testError = false
      let testCancel = false
      let testUndefined = false
      let updateJob = false
      let jobProcessTimeoutId = false

      function testHandler (job, next, onCancel) {
        if (testTimes) {
          const testDate = datetime.add.ms(new Date(),
            1000 + job.timeout + (job.retryCount * job.retryDelay))
          t.ok(is.dateBefore(job.dateEnable, testDate), 'Job dateEnable is valid')
          tryCount++
        }

        t.pass(`Job Started: Delay: [${jobDelay}] ID: [${job.id}]`)
        if (testError) {
          const errObj = new Error(tData)
          next(errObj)
        } else if (testCancel) {
          const cancelErr = new Error(tData)
          cancelErr.cancelJob = tData
          next(cancelErr)
        } else if (updateJob) {
          job.updateNote = tData
          next(null, job)
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
            testUndefined && t.pass('next() with undefined arguments tested')
            testUndefined ? next() : next(null, 'Job Completed: ' + job.id)
            .then((runningJobs) => {
              t.ok(is.integer(runningJobs), `Next call returns running jobs [${runningJobs}]`)
            })
          }, jobDelay)

          return onCancel(job, () => {
            clearTimeout(jobProcessTimeoutId)
            jobProcessTimeoutId = false
            t.pass('onCancel invoked')
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
      }).delay(1000).then(() => {
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
      }).delay(jobDelay * 0.9).then(() => {
        t.equal(q._running, q._concurrency, 'Queue is processing only one job')
        q._concurrency = 3
        return q.pause()
      }).then(() => {
        q.on(enums.status.idle, idleEventHandler)
        return q.resume()
      }).delay(jobDelay * 0.9).then(() => {
        t.equal(q._running, q._concurrency, 'Queue is processing max concurrent jobs')
      }).delay(jobDelay * 8).then(() => {
        q.removeListener(enums.status.idle, idleEventHandler)
        t.ok(q.idle, 'Queue is idle')

        // ---------- Repeat True Test ----------
        t.comment('queue-process: Repeat True')
        jobs = q.createJob().setRepeat(true).setRepeatDelay(repeatDelay)
        t.ok(jobs.repeat, 'Job repeat is true')
        t.equal(jobs.repeatDelay, repeatDelay, 'Job repeat delay is valid')
        return q.pause()
      }).then(() => {
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 1, `Jobs saved successfully: [${savedJobs.length}]`)
        return resumeProcessPauseGet()
      }).then((repeatJob) => {
        t.equal(repeatJob[0].processCount, 1, 'Repeat job processed once')
        t.equal(repeatJob[0].status, enums.status.waiting, 'Repeat job is waiting')
        testUndefined = true
        return resumeProcessPauseGet()
      }).then((repeatJob) => {
        t.equal(repeatJob[0].processCount, 2, 'Repeat job processed twice')
        t.equal(repeatJob[0].status, enums.status.waiting, 'Repeat job is waiting')
        testUndefined = false
        return resumeProcessPauseGet()
      }).then((repeatJob) => {
        t.equal(repeatJob[0].processCount, 3, 'Repeat job processed three times')
        t.equal(repeatJob[0].status, enums.status.waiting, 'Repeat job is waiting')
        return resumeProcessPauseGet()
      }).then((repeatJob) => {
        t.equal(repeatJob[0].processCount, 4, 'Repeat job processed four times')
        t.equal(repeatJob[0].status, enums.status.waiting, 'Repeat job is waiting')
        return resumeProcessPauseGet()
      }).then((repeatJob) => {
        t.equal(repeatJob[0].processCount, 5, 'Repeat job processed five times')
        t.equal(repeatJob[0].status, enums.status.waiting, 'Repeat job is waiting')
        return q.cancelJob(jobs)
      }).then((cancelledJobs) => {
        t.ok(is.uuid(cancelledJobs[0]), 'repeat job cancelled')
        return q.getJob(jobs)
      }).then((cancelledJobs) => {
        t.equal(cancelledJobs[0].processCount, 5, `Job repeated 5 times before cancel`)
        t.equal(cancelledJobs[0].log.length, 12, 'repeat job log count valid')

        // ---------- Repeat Number Test ----------
        t.comment('queue-process: Repeat Number')
        jobs = q.createJob().setRepeat(4).setRepeatDelay(repeatDelay)
        t.equal(jobs.repeat, 4, `Job repeat is 4`)
        t.equal(jobs.repeatDelay, repeatDelay, 'Job repeat delay is valid')
        return q.pause()
      }).then(() => {
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 1, `Jobs saved successfully: [${savedJobs.length}]`)
        return resumeProcessPauseGet()
      }).then((repeatJob) => {
        t.equal(repeatJob[0].processCount, 1, 'Repeat job processed once')
        t.equal(repeatJob[0].status, enums.status.waiting, 'Repeat job is waiting')
        return resumeProcessPauseGet()
      }).then((repeatJob) => {
        t.equal(repeatJob[0].processCount, 2, 'Repeat job processed twice')
        t.equal(repeatJob[0].status, enums.status.waiting, 'Repeat job is waiting')
        return resumeProcessPauseGet()
      }).then((repeatJob) => {
        t.equal(repeatJob[0].processCount, 3, 'Repeat job processed three times')
        t.equal(repeatJob[0].status, enums.status.waiting, 'Repeat job is waiting')
        return resumeProcessPauseGet()
      }).then((repeatJob) => {
        t.equal(repeatJob[0].processCount, 4, 'Repeat job processed four times')
        t.equal(repeatJob[0].status, enums.status.waiting, 'Repeat job is waiting')
        return resumeProcessPauseGet()
      }).then((completedJobs) => {
        t.equal(completedJobs[0].processCount, 5, 'Repeat job processed five times')
        t.equal(completedJobs[0].status, enums.status.completed, 'Repeat job is completed')
        t.equal(completedJobs[0].log.length, 11, 'repeat job log count valid')
        return q.resume()
      }).then(() => {
        //
        // ---------- Processing with Job Update Test ----------
        t.comment('queue-process: Processing with Job Update')
        updateJob = true
        jobs = q.createJob()
        return q.addJob(jobs)
      }).delay(1000).then(() => {
        return q.getJob(jobs)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].updateNote, tData, 'Job updated in next() call successfully')
        t.equal(updatedJob[0].status, enums.status.waiting, 'Job status is waiting')
        t.equal(updatedJob[0].log.reverse()[1].message, enums.message.jobPassBack, 'Job pass back log entry valid')
        t.equal(updatedJob[0].getLastLog().message, enums.message.jobUpdated, 'Job updated log entry valid')
        return q.removeJob(updatedJob[0])
      }).then(() => {
        updateJob = false
        //
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
        testError = true

        // ---------- Processing with Error Test ----------
        t.comment('queue-process: Processing with Error')
        jobs = q.createJob()
        return q.addJob(jobs)
      }).delay(1000).then(() => {
        return q.getJob(jobs)
      }).then((errorJob) => {
        t.equal(errorJob[0].status, enums.status.failed, 'Job failed on error')
      }).then(() => {
        testError = false
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
        qGlobalCancel = new Queue(tOpts.cxn(), tOpts.default(tableName))
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
