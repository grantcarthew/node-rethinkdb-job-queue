const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const enums = require('../src/enums')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const queueDb = require('../src/queue-db')
const dbReview = require('../src/db-review')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-db', (t) => {
      t.plan(70)

      const q = testQueue()

      let readyEventCount = 0
      q.on(enums.status.ready, function readyEventHandler (qid) {
        readyEventCount++
        t.pass(`Event: Queue ready [${qid}]`)
        t.equal(qid, q.id, `Event: Queue ready id is valid`)
        if (readyEventCount >= 6) {
          this.removeListener(enums.status.ready, readyEventHandler)
        }
      })

      let detachEventCount = 0
      q.on(enums.status.detached, function detachedEventHandler (qid) {
        detachEventCount++
        t.pass(`Event: Queue detached [${qid}]`)
        t.equal(qid, q.id, `Event: Queue detached id valid`)
        if (detachEventCount >= 6) {
          this.removeListener(enums.status.detached, detachedEventHandler)
        }
      })

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        q._master = true
        q.changeFeed = true
        return dbReview.enable(q)
      }).then((ready) => {
        t.ok(ready >= 0, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q, true)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(this.ready, 'Queue is not ready')

        // ---------- Attach with change feed and master ----------
        t.comment('queue-db: Attach with Change Feed and Master')
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q, true)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(this.ready, 'Queue is not ready')
        q._master = false
        q.changeFeed = true

        // ---------- Attach with change feed NOT master ----------
        t.comment('queue-db: Attach with Change Feed NOT Master')
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q, true)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(this.ready, 'Queue is not ready')
        q._master = true
        q.changeFeed = false

        // ---------- Attach with master NOT change feed ----------
        t.comment('queue-db: Attach with Master NOT Change Feed')
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q, true)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(this.ready, 'Queue is not ready')
        q._master = false
        q.changeFeed = false

        // ---------- Attach without change feed or master ----------
        t.comment('queue-db: Attach without Change Feed or Master')
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q, true)
      }).then(() => {
        t.pass('Pass: Queue detached with pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(this.ready, 'Queue is not ready')
        q._master = true
        q.changeFeed = true

        // ---------- Attach with change feed and master ----------
        t.comment('queue-db: Attach with Change Feed and Master')
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q, false)
      }).then(() => {
        t.pass('Pass: Queue detached without pool drain')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue is ready')

        // ---------- Detach with Drain ----------
        t.comment('queue-db: Detach with Drain')
        return queueDb.detach(q, true)
      }).then(() => {
        q._master = false
        q.changeFeed = true

        // ---------- Attach with change feed NOT master ----------
        t.comment('queue-db: Attach with Change Feed NOT Master')
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
