const test = require('tape')
const Promise = require('bluebird')
const enums = require('../src/enums')
const is = require('../src/is')
const tError = require('./test-error')
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const proxyquire = require('proxyquire')
const processStub = {}
const queueInterruption = proxyquire('../src/queue-interruption',
  { './queue-process': processStub })

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-interruption', (t) => {
      t.plan(19)

      const q = new Queue(tOpts.cxn(), tOpts.default())
      processStub.restart = function (q) {
        t.ok(q.id, 'Queue process restart called')
      }

      // ---------- Event Handler Setup ----------
      let testEvents = false
      let pausingEventCount = 0
      let pausingEventTotal = 1
      function pausingEventHandler (global, queueId) {
        pausingEventCount++
        if (testEvents) {
          t.pass(`Event: pausing [${pausingEventCount} of ${pausingEventTotal}] `)
          t.ok(is.boolean(global), `Event: pausing [global: ${global}]`)
          t.ok(is.string(queueId), `Event: pausing [queueId: ${queueId}]`)
        }
      }
      let pausedEventCount = 0
      let pausedEventTotal = 1
      function pausedEventHandler (global, queueId) {
        pausedEventCount++
        if (testEvents) {
          t.pass(`Event: paused [${pausedEventCount} of ${pausedEventTotal}] `)
          t.ok(is.boolean(global), `Event: paused [global: ${global}]`)
          t.ok(is.string(queueId), `Event: paused [queueId: ${queueId}]`)
        }
      }
      let resumedEventCount = 0
      let resumedEventTotal = 1
      function resumedEventHandler (global, queueId) {
        resumedEventCount++
        if (testEvents) {
          t.pass(`Event: resumed [${resumedEventCount} of ${resumedEventTotal}] `)
          t.ok(is.boolean(global), `Event: resumed [global: ${global}]`)
          t.ok(is.string(queueId), `Event: resumed [queueId: ${queueId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.paused, pausingEventHandler)
        q.on(enums.status.paused, pausedEventHandler)
        q.on(enums.status.resumed, resumedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.pausing, pausedEventHandler)
        q.removeListener(enums.status.paused, pausedEventHandler)
        q.removeListener(enums.status.resumed, resumedEventHandler)
      }

      return q.ready().then((ready) => {
        addEventHandlers()
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
        removeEventHandlers()

        // ---------- Event summary Test ----------
        t.comment('queue-interruption: Event Summary')
        t.equal(pausingEventCount, pausingEventTotal, 'Pausing event count valid')
        t.equal(pausedEventCount, pausedEventTotal, 'Paused event count valid')
        t.equal(resumedEventCount, resumedEventTotal, 'Resumed event count valid')

        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
