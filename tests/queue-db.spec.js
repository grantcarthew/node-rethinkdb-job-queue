const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const queueDb = require('../src/queue-db')
const dbReview = require('../src/db-review')
const enums = require('../src/enums')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-db test', (t) => {
      t.plan(57)

      const q = testQueue()

      let readyEventCount = 0
      q.on(enums.status.ready, function readyEventHandler () {
        readyEventCount++
        t.pass('Event: Queue ready')
        if (readyEventCount >= 6) {
          this.removeListener(enums.status.ready, readyEventHandler)
        }
      })

      let detachEventCount = 0
      q.on(enums.status.detached, function detachedEventHandler () {
        detachEventCount++
        t.pass('Event: Queue detached')
        if (detachEventCount >= 6) {
          this.removeListener(enums.status.detached, detachedEventHandler)
        }
      })

      q.ready.then(() => {
        q.isMaster = true
        q.enableChangeFeed = true
        return dbReview.enable(q)
      }).then((ready) => {
        t.ok(ready >= 0, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        // ---------- Detach with Drain ----------
        return queueDb.detach(q, true)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(this.ready, 'Queue is not ready')
        // ---------- Attach with change feed and master ----------
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        // ---------- Detach with Drain ----------
        return queueDb.detach(q, true)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(this.ready, 'Queue is not ready')
        q.isMaster = false
        q.enableChangeFeed = true
        // ---------- Attach with change feed NOT master ----------
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        // ---------- Detach with Drain ----------
        return queueDb.detach(q, true)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(this.ready, 'Queue is not ready')
        q.isMaster = true
        q.enableChangeFeed = false
        // ---------- Attach with master NOT change feed ----------
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        // ---------- Detach with Drain ----------
        return queueDb.detach(q, true)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(this.ready, 'Queue is not ready')
        q.isMaster = false
        q.enableChangeFeed = false
        // ---------- Attach without change feed or master ----------
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        // ---------- Detach with Drain ----------
        return queueDb.detach(q, true)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(this.ready, 'Queue is not ready')
        q.isMaster = true
        q.enableChangeFeed = true
        // ---------- Attach with change feed and master ----------
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        // ---------- Detach without Drain ----------
        return queueDb.detach(q, false)
      }).then(() => {
        t.pass('Pass: Queue detached without pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue is ready')
        // ---------- Detach with Drain ----------
        return queueDb.detach(q, true)
      }).then(() => {
        q.isMaster = false
        q.enableChangeFeed = true
        // ---------- Attach with change feed NOT master ----------
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        return resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
