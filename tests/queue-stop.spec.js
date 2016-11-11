const test = require('tape')
const Promise = require('bluebird')
const is = require('../src/is')
const enums = require('../src/enums')
const tError = require('./test-error')
const queueStop = require('../src/queue-stop')
const queueDb = require('../src/queue-db')
const dbReview = require('../src/db-review')
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-stop'

module.exports = function () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(78)

      let q = new Queue(tOpts.cxn(), tOpts.master(999999))

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 0,
        progress: 0,
        pausing: 1,
        paused: 1,
        resumed: 0,
        removed: 0,
        reset: 0,
        error: 0,
        reviewed: 0,
        detached: 1,
        stopping: 1,
        stopped: 1,
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

      function simulateJobProcessing () {
        q._running = 1
        setTimeout(function setRunningToZero () {
          q._running = 0
        }, 500)
      }

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.ready()
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(q), 'Review is enabled')
        t.ok(q._changeFeedCursor.connection.open, 'Change feed is connected')
        t.notOk(q.paused, 'Queue is not paused')
        eventHandlers.add(t, q, state)

        // ---------- Stop with Drain ----------
        t.comment('queue-stop: Stop with Drain')
        simulateJobProcessing()
        return queueStop(q, true)
      }).then((stopped) => {
        t.ok(stopped, 'Queue stopped with pool drain')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.notOk(q._changeFeedCursor, 'Change feed is disconnected')
        t.ok(q.paused, 'Queue is paused')
        return q.ready()
      }).then((ready) => {
        t.notOk(ready, 'Queue ready returns false')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)

        // ---------- Stop without Drain ----------
        t.comment('queue-stop: Stop without Drain')
        q = new Queue(tOpts.cxn(), tOpts.master(999999))
        return q.ready()
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        state.detached = 0
        eventHandlers.add(t, q, state)
        t.ok(dbReview.isEnabled(q), 'Review is enabled')
        t.ok(q._changeFeedCursor.connection.open, 'Change feed is connected')
        t.notOk(q.paused, 'Queue is not paused')
        simulateJobProcessing()
        return queueStop(q, false)
      }).then((stopped2) => {
        t.ok(stopped2, 'Queue stopped without pool drain')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.notOk(q._changeFeedCursor, 'Change feed is disconnected')
        t.ok(q.paused, 'Queue is paused')
        return q.ready()
      }).then((ready) => {
        t.ok(ready, 'Queue is still ready')
        // detaching with drain or node will not exit gracefully
        return queueDb.detach(q, true)
      }).then(() => {
        return queueDb.attach(q, tOpts.cxn())
      }).then(() => {
        return q.ready()
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        return q.resume()
      }).then(() => {
        t.ok(dbReview.isEnabled(q), 'Review is enabled')
        t.ok(q._changeFeedCursor.connection.open, 'Change feed is connected')
        t.notOk(q.paused, 'Queue is not paused')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
