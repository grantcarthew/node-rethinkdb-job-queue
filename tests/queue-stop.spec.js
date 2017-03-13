const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const queueStop = require('../src/queue-stop')
const queueDb = require('../src/queue-db')
const dbReview = require('../src/db-review')
const Queue = require('../src/queue')
const simulateJobProcessing = require('./test-utils').simulateJobProcessing
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-stop'

queueStopTests()
function queueStopTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(79)

      const tableName = 'queueStop'
      let q = new Queue(tOpts.cxn(), tOpts.master(tableName, 999999))

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
        simulateJobProcessing(q)
        return queueStop(q)
      }).then((stopped) => {
        return queueDb.drain(q)
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
        q = new Queue(tOpts.cxn(), tOpts.master(tableName, 999999))
        return q.ready()
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        eventHandlers.add(t, q, state)
        t.ok(dbReview.isEnabled(q), 'Review is enabled')
        t.ok(q._changeFeedCursor.connection.open, 'Change feed is connected')
        t.notOk(q.paused, 'Queue is not paused')
        simulateJobProcessing(q)
        return queueStop(q)
      }).then((stopped2) => {
        t.ok(stopped2, 'Queue stopped without pool drain')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.notOk(q._changeFeedCursor, 'Change feed is disconnected')
        t.ok(q.paused, 'Queue is paused')
        return q.ready()
      }).then((ready) => {
        t.ok(ready, 'Queue is still ready')
        // detaching with drain or node will not exit gracefully
        return queueDb.detach(q)
      }).then(() => {
        return queueDb.drain(q)
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
