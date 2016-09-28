const test = require('tape')
const Promise = require('bluebird')
// const datetime = require('../src/datetime')
const enums = require('../src/enums')
const is = require('../src/is')
const tError = require('./test-error')
const tData = require('./test-options').tData
const tOpts = require('./test-options')
const Queue = require('../src/queue')
const queueState = require('../src/queue-state')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-state', (t) => {
      t.plan(15)

      const q = new Queue(tOpts.cxn(), tOpts.default())
      const q2 = new Queue(tOpts.cxn(), tOpts.default())
      const job = q.createJob()
      job.data = tData

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
        q.removeListener(enums.status.paused, pausingEventHandler)
        q.removeListener(enums.status.paused, pausedEventHandler)
        q.removeListener(enums.status.resumed, resumedEventHandler)
      }

      q.reset().then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        addEventHandlers()

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

        // ---------- Event summary Test ----------
        t.comment('queue-state: Event Summary')
        t.equal(pausingEventCount, pausingEventTotal, 'Pausing event count valid')
        t.equal(pausedEventCount, pausedEventTotal, 'Paused event count valid')
        t.equal(resumedEventCount, resumedEventTotal, 'Resumed event count valid')

        removeEventHandlers()
        q.stop()
        q2.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
