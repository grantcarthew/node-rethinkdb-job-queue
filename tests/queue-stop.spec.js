const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const queueStop = require('../src/queue-stop')
const queueDb = require('../src/queue-db')
const dbReview = require('../src/db-review')
const enums = require('../src/enums')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-stop test', (t) => {
      t.plan(45)

      const q = testQueue()
      q.ready.then(() => {
        q.running = 1
        q.isMaster = true
        return q.review(true)
      }).then((ready) => {
        t.ok(ready >= 0, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        t.ok(q.r.getPoolMaster()._healthy, 'Connection pool is healthy')
        // Forcefully with Drain
        return queueStop(q, 500, true)
      }).then((forceStopMessage) => {
        t.pass('Queue stopped forcefully after timeout with pool drain')
        t.equal(forceStopMessage, enums.message.failedToStop, 'Stop return message is valid')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(q.r.getPoolMaster()._healthy, 'Connection pool is down')
        t.notOk(this.ready, 'Queue is not ready')
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        t.ok(q.r.getPoolMaster()._healthy, 'Connection pool is healthy')
        setTimeout((q) => { q.running = 0 }, 200, q)
        // Gracefully with Drain
        return queueStop(q, 500, true)
      }).then((jobsStoppedMessage) => {
        t.pass('Queue stopped gracefully with pool drain')
        t.equal(jobsStoppedMessage, enums.message.allJobsStopped, 'Stop return message is valid')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(q.r.getPoolMaster()._healthy, 'Connection pool is down')
        t.notOk(q.ready, 'Queue is not ready')
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        t.ok(q.r.getPoolMaster()._healthy, 'Connection pool is healthy')
        q.running = 1
        // Forcefully without Drain
        return queueStop(q, 500, false)
      }).then((forceStopMessage2) => {
        t.pass('Queue stopped forcefully after timeout without pool drain')
        t.equal(forceStopMessage2, enums.message.failedToStop, 'Stop return message is valid')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.ok(q.r.getPoolMaster()._healthy, 'Connection pool healthy')
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue is still ready')
        // detaching with drain or node will not exit gracefully TODO: need to test r before making a new connection
        return queueDb.detach(q, true)
      }).then(() => {
        t.notOk(q.r.getPoolMaster()._healthy, 'Connection pool is down')
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        t.ok(q.r.getPoolMaster()._healthy, 'Connection pool is healthy')
        setTimeout((q) => { q.running = 0 }, 200, q)
        // Gracefully without Drain
        return queueStop(q, 500, false)
      }).then((forceStopMessage2) => {
        t.pass('Queue stopped gracefully after timeout without pool drain')
        t.equal(forceStopMessage2, enums.message.allJobsStopped, 'Stop return message is valid')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue is still ready')
        // detaching with drain or node will not exit gracefully TODO: need to test r before making a new connection
        return queueDb.detach(q, true)
      }).then((ready) => {
        t.notOk(q.r.getPoolMaster()._healthy, 'Connection pool is down')
        return queueDb.attach(q)
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        t.ok(q.r.getPoolMaster()._healthy, 'Connection pool is healthy')
        return resolve()
      })
    })
  })
}
