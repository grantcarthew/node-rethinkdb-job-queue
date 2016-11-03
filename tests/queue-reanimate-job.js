const test = require('tape')
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

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-reanimate', (t) => {
      t.plan(1000)

      // ---------- Test Setup ----------
      const q = new Queue(tOpts.cxn(), tOpts.default())

      let jobs
      let jobDelay = 200
      const noOfJobsToCreate = 10
      const allJobsDelay = jobDelay * (noOfJobsToCreate + 2)

      // ---------- Event Handler Setup ----------
      let state = {
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
        log: 0,
        updated: 0
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
        return q.resume()
      }).delay(jobDelay / 2).then(() => {
        t.equal(q._running, q._concurrency, 'Queue is processing max concurrent jobs')
      }).delay(jobDelay * 8).then(() => {
        completedEventCount = state.count.get(enums.status.completed)
        t.equal(state.count.get(enums.status.completed), noOfJobsToCreate, `Queue has completed ${completedEventCount} jobs`)
        t.ok(q.idle, 'Queue is idle')

        // ---------- Queue Summary ----------
        t.comment('queue-process: Queue Summary')
        return q.summary()
      }).then((queueSummary) => {
        t.equal(queueSummary.completed, summaryCompleted, `Summary ${summaryCompleted} jobs completed`)
        t.equal(queueSummary.cancelled, summaryCancelled, `Summary ${summaryCancelled} job cancelled`)
        t.equal(queueSummary.terminated, summaryTerminated, `Summary ${summaryTerminated} job terminated`)

        // ---------- Event Summary ----------
        t.comment('queue-process: Event Summary')
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
