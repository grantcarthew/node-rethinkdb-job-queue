const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const Queue = require('../src/queue')
const dbReview = require('../src/db-review')
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-change'

queueChangeTests()
function queueChangeTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(61)

      const tableName = 'queueChange'
      const q = new Queue(tOpts.cxn(), tOpts.default(tableName))
      const qPub = new Queue(tOpts.cxn(), tOpts.default(tableName))

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 1,
        processing: 3,
        progress: 3,
        pausing: 3,
        paused: 3,
        resumed: 2,
        removed: 1,
        reset: 0,
        error: 0,
        reviewed: 2,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 3,
        waiting: 0,
        active: 3,
        completed: 1,
        cancelled: 1,
        failed: 1,
        terminated: 1,
        reanimated: 0,
        log: 1,
        updated: 0
      }

      let job = qPub.createJob()
      let processDelay = 500

      eventHandlers.add(t, q, state)

      return qPub.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.pause()
      }).then(() => {
        q.process((j, next) => {
          setTimeout(function jobProcessing () {
            t.equal(j.id, job.id, `Job Processed [${j.id}]`)
            next(null, 'queue-change')
          }, processDelay)
          return j.updateProgress(50)
        })

        // ---------- Test added, active, progress completed, removed  ----------
        t.comment('queue-change: added, active, progress, completed, and removed change events')
      }).then(() => {
        return qPub.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.resume()
      }).then(() => {
        t.ok(!q.paused, 'Queue not paused')
      }).delay(processDelay).then(() => {
        return q.pause()
      }).delay(processDelay).then(() => {
        return q.removeJob(job.id)
      }).delay(processDelay).then(() => {
        //
        // ---------- Test global review  ----------
        t.comment('queue-change: global review')
        // The following will raise a 'reviewed' event.
        return dbReview.runOnce(qPub)
      }).then(() => {
        //
        // ---------- Test failed and terminated ----------
        t.comment('queue-change: failed and terminated change events')
        job = qPub.createJob()
        job.timeout = processDelay / 2000
        job.retryDelay = 0
        job.retryMax = 1
        return qPub.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.resume()
      }).then(() => {
        t.ok(!q.paused, 'Queue not paused')
      }).delay(processDelay * 2).then(() => {
        return q.pause()
      }).delay(processDelay).then(() => {
        job = qPub.createJob()

        // ---------- Test log and cancelled ----------
        t.comment('queue-change: log and cancelled change events')
        return qPub.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return savedJob[0].addLog(null, 'test log')
      }).then(() => {
        return qPub.cancelJob(job.id, 'testing')
      }).delay(processDelay).then(() => {
        //
        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)

        return q.reset()
      }).then((resetResult) => {
        return Promise.all([
          q.stop(),
          qPub.stop()
        ])
      }).then(() => {
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
