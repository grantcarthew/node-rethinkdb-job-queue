const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const queueDelete = require('../src/queue-delete')
const queueDb = require('../src/queue-db')
const dbReview = require('../src/db-review')
const enums = require('../src/enums')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-stop test', (t) => {
      t.plan(46)

      const q = testQueue()

      function deletedEventHandler () {
        t.pass('Queue deleted event raised')
        this.removeListener(enums.queueStatus.deleted, deletedEventHandler)
      }
      q.on(enums.queueStatus.deleted, deletedEventHandler)

      q.ready.then(() => {
        t.pass('Queue in a ready state')
        q.running = 1
        return queueDelete(q, 100)
        // Forcefully with Drain
        return queueStop(q, 500, true)
      }).then((forceStopMessage) => {
        t.pass('Queue stopped forcefully after timeout with pool drain')
        t.equal(forceStopMessage, enums.message.failedToStop, 'Stop return message is valid')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.ok(q.paused, 'Queue is paused')
        t.notOk(this.ready, 'Queue is not ready')
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        t.notOk(q.paused, 'Queue is not paused')
        setTimeout((q) => { q.running = 0 }, 200, q)
        // Gracefully with Drain
        return queueStop(q, 500, true)
      }).then((jobsStoppedMessage) => {
        t.pass('Queue stopped gracefully with pool drain')
        t.equal(jobsStoppedMessage, enums.message.allJobsStopped, 'Stop return message is valid')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.ok(q.paused, 'Queue is paused')
        t.notOk(q.ready, 'Queue is not ready')
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        t.notOk(q.paused, 'Queue is not paused')
        q.running = 1
        // Forcefully without Drain
        return queueStop(q, 500, false)
      }).then((forceStopMessage2) => {
        t.pass('Queue stopped forcefully after timeout without pool drain')
        t.equal(forceStopMessage2, enums.message.failedToStop, 'Stop return message is valid')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.ok(q.paused, 'Queue is paused')
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue is still ready')
        // detaching with drain or node will not exit gracefully
        return queueDb.detach(q, true)
      }).then(() => {
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        t.notOk(q.paused, 'Queue is not paused')
        setTimeout((q) => { q.running = 0 }, 200, q)
        // Gracefully without Drain
        return queueStop(q, 500, false)
      }).then((forceStopMessage2) => {
        t.pass('Queue stopped gracefully after timeout without pool drain')
        t.equal(forceStopMessage2, enums.message.allJobsStopped, 'Stop return message is valid')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.ok(q.paused, 'Queue is paused')
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue is still ready')
        // detaching with drain or node will not exit gracefully
        return queueDb.detach(q, true)
      }).then(() => {
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        t.notOk(q.paused, 'Queue is not paused')
        return resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
