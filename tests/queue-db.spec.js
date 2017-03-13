const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const queueDb = require('../src/queue-db')
const dbReview = require('../src/db-review')
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-db'

queueDbTests()
function queueDbTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(75)

      const tableName = 'queueDb'
      const q = new Queue(tOpts.cxn(), tOpts.default(tableName))

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
        reset: 0,
        error: 0,
        reviewed: 0,
        detached: 1,
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

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        eventHandlers.add(t, q, state)
        q._masterInterval = 300
        q._changeFeed = true
        dbReview.enable(q)
        return q.ready()
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(q), 'Review is enabled')
        t.ok(q._changeFeedCursor.connection.open, 'Change feed is connected')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q)
      }).then(() => {
        return queueDb.drain(q)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.notOk(q._changeFeedCursor, 'Change feed is disconnected')
        return q.ready()
      }).then((ready) => {
        t.notOk(ready, 'Queue is not ready')

        // ---------- Attach with change feed and master ----------
        t.comment('queue-db: Attach with Change Feed and Master')
        return queueDb.attach(q, tOpts.cxn())
      }).then(() => {
        return q.ready()
      }).then((ready) => {
        eventHandlers.add(t, q, state)
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(q), 'Review is enabled')
        t.ok(q._changeFeedCursor.connection.open, 'Change feed is connected')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q)
      }).then(() => {
        return queueDb.drain(q)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.notOk(q._changeFeedCursor, 'Change feed is disconnected')
        return q.ready()
      }).then((ready) => {
        t.notOk(ready, 'Queue is not ready')
        q._masterInterval = false
        q._changeFeed = true

        // ---------- Attach with change feed NOT master ----------
        t.comment('queue-db: Attach with Change Feed NOT Master')
        return queueDb.attach(q, tOpts.cxn())
      }).then(() => {
        return q.ready()
      }).then((ready) => {
        eventHandlers.add(t, q, state)
        t.ok(ready, 'Queue in a ready state')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.ok(q._changeFeedCursor.connection.open, 'Change feed is connected')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q)
      }).then(() => {
        return queueDb.drain(q)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.notOk(q._changeFeedCursor, 'Change feed is disconnected')
        return q.ready()
      }).then((ready) => {
        t.notOk(ready, 'Queue is not ready')
        q._masterInterval = 300
        q._changeFeed = false

        // ---------- Attach with master NOT change feed ----------
        t.comment('queue-db: Attach with Master NOT Change Feed')
        return queueDb.attach(q, tOpts.cxn())
      }).then(() => {
        return q.ready()
      }).then((ready) => {
        eventHandlers.add(t, q, state)
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(q), 'Review is enabled')
        t.notOk(q._changeFeedCursor, 'Change feed is disconnected')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q)
      }).then(() => {
        return queueDb.drain(q)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.notOk(q._changeFeedCursor, 'Change feed is disconnected')
        return q.ready()
      }).then((ready) => {
        t.notOk(ready, 'Queue is not ready')
        q._masterInterval = false
        q._changeFeed = false

        // ---------- Attach without change feed or master ----------
        t.comment('queue-db: Attach without Change Feed or Master')
        return queueDb.attach(q, tOpts.cxn())
      }).then(() => {
        return q.ready()
      }).then((ready) => {
        eventHandlers.add(t, q, state)
        t.ok(ready, 'Queue in a ready state')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.notOk(q._changeFeedCursor, 'Change feed is disconnected')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q)
      }).then(() => {
        return queueDb.drain(q)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.notOk(q._changeFeedCursor, 'Change feed is disconnected')
        return q.ready()
      }).then((ready) => {
        t.notOk(ready, 'Queue is not ready')
        q._masterInterval = 300
        q._changeFeed = true

        // ---------- Attach with change feed and master ----------
        t.comment('queue-db: Attach with Change Feed and Master')
        return queueDb.attach(q, tOpts.cxn())
      }).then(() => {
        return q.ready()
      }).then((ready) => {
        eventHandlers.add(t, q, state)
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(q), 'Review is enabled')
        t.ok(q._changeFeedCursor.connection.open, 'Change feed is connected')

        // ---------- Detach without Drain ----------
        t.comment('queue-db: Detach without Drain')
        return queueDb.detach(q)
      }).then(() => {
        t.pass('Pass: Queue detached without pool drain')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.notOk(q._changeFeedCursor, 'Change feed is disconnected')
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue is ready')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q)
      }).then(() => {
        return queueDb.drain(q)
      }).then(() => {
        q._masterInterval = false
        q._changeFeed = true

        // ---------- Attach with change feed NOT master ----------
        t.comment('queue-db: Attach with Change Feed NOT Master')
        return queueDb.attach(q, tOpts.cxn())
      }).then(() => {
        return q.ready()
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.notOk(dbReview.isEnabled(q), 'Review is disabled')
        t.ok(q._changeFeedCursor.connection.open, 'Change feed is connected')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
