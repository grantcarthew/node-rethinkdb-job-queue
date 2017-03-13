const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const queueReset = require('../src/queue-reset')
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-reset'

queueResetTests()
function queueResetTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(32)

      const q = new Queue(tOpts.cxn(), tOpts.default('queueReset'))
      const jobs = [
        q.createJob(),
        q.createJob(),
        q.createJob()
      ]

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 0,
        progress: 0,
        pausing: 0,
        paused: 0,
        resumed: 0,
        removed: 0,
        reset: 1,
        error: 0,
        reviewed: 0,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 3,
        waiting: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
        terminated: 0,
        reanimated: 0,
        log: 0,
        updated: 0
      }

      return q.reset().then((removed) => {
        t.ok(is.integer(removed), 'Initial reset succeeded')
        eventHandlers.add(t, q, state)
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 3, 'Jobs saved successfully')
        return q.summary()
      }).then((beforeSummary) => {
        t.equal(beforeSummary.waiting, 3, 'Status summary contains correct value')
        return queueReset(q)
      }).then((total) => {
        t.equal(total, 3, 'Queue reset removed valid number of jobs')
        return q.summary()
      }).then((afterSummary) => {
        t.equal(afterSummary.waiting, 0, 'Status summary contains no added jobs')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)

        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
