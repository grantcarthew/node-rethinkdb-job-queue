const test = require('tap').test
const Promise = require('bluebird')
const tError = require('./test-error')
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const proxyquire = require('proxyquire')
const processStub = {}
const queueInterruption = proxyquire('../src/queue-interruption',
  { './queue-process': processStub })
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-interruption'

queueInterruptionTests()
function queueInterruptionTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(33)

      const q = new Queue(tOpts.cxn(), tOpts.default('queueInterruption'))
      processStub.restart = function (q) {
        t.ok(q.id, 'Queue process restart called')
      }

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

      return q.ready().then((ready) => {
        eventHandlers.add(t, q, state)
        t.ok(ready, 'Queue is ready')

        // ---------- Pause Test ----------
        t.comment('queue-interruption: Pause')
        t.notOk(q.paused, 'Queue is not paused')
        // Simulate running jobs
        q._running = 1
        setTimeout(function setRunningToZero () {
          q._running = 0
        }, 400)
        return queueInterruption.pause(q)
      }).then((paused) => {
        t.ok(paused, 'Interruption pause returns true')
        t.ok(q.paused, 'Queue is paused')

        // ---------- Resume Test ----------
        t.comment('queue-interruption: Resume')
        return queueInterruption.resume(q)
      }).then((resumed) => {
        t.ok(resumed, 'Interruption resume returns true')
        t.notOk(q.paused, 'Queue is not paused')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)

        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
