const test = require('tape')
const Promise = require('bluebird')
const enums = require('../src/enums')
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
      t.plan(10)

      const q = new Queue(tOpts.default(), tOpts.cxn())
      processStub.restart = function (q) {
        t.ok(q.id, 'Queue process restart called')
      }

      // ---------- Event Handler Setup ----------
      let testEvents = false
      function pausingEventHandler (qId) {
        if (testEvents) {
          t.equal(qId, q.id, `Event: pausing [${qId}]`)
        }
      }
      function pausedEventHandler (qId) {
        if (testEvents) {
          t.equal(qId, q.id, `Event: paused [${qId}]`)
        }
      }
      function resumedEventHandler (qId) {
        if (testEvents) {
          t.equal(qId, q.id, `Event: resumed [${qId}]`)
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
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
