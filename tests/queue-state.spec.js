const test = require('tap').test
const Promise = require('bluebird')
const enums = require('../src/enums')
const tError = require('./test-error')
const tData = require('./test-options').tData
const tOpts = require('./test-options')
const Queue = require('../src/queue')
const queueState = require('../src/queue-state')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-state'

queueStateTests()
function queueStateTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(29)

      const tableName = 'queueState'
      const q = new Queue(tOpts.cxn(), tOpts.default(tableName))
      const q2 = new Queue(tOpts.cxn(), tOpts.default(tableName))
      const job = q.createJob()
      job.data = tData

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 0,
        progress: 0,
        pausing: 1,
        paused: 1,
        resumed: 1,
        removed: 0,
        reset: 0,
        error: 0,
        reviewed: 0,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 0,
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

      q.reset().then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        eventHandlers.add(t, q, state)

        // ---------- Global Pause Test ----------
        t.comment('queue-state: Global Pause')
        return queueState(q2, enums.status.paused)
      }).then((resetResult) => {
        t.ok(q.paused, 'Local queue is paused')
        //
        // ---------- Global Resume Test ----------
        t.comment('queue-state: Global Resume')
        return queueState(q2, enums.status.active)
      }).then((resetResult) => {
        t.notOk(q.paused, 'Local queue is resumed')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)

        q.stop()
        q2.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
