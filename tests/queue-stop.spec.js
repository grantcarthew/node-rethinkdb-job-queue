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

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-stop', (t) => {
      t.plan(31)

      const q = new Queue(tOpts.cxn(), tOpts.default())

      let testEvents = false
      function stoppingEventHandler (qid) {
        if (testEvents) {
          t.pass(`Event: Queue stopping [${qid}]`)
          t.equal(qid, q.id, `Event: Queue stopping id is valid`)
        }
      }
      function stoppedEventHandler (qid) {
        if (testEvents) {
          t.pass(`Event: Queue stopped [${qid}]`)
          t.equal(qid, q.id, `Event: Queue stopped id is valid`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.stopping, stoppingEventHandler)
        q.on(enums.status.stopped, stoppedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.stopping, stoppingEventHandler)
        q.removeListener(enums.status.stopped, stoppedEventHandler)
      }

      function simulateJobProcessing () {
        q._running = 1
        setTimeout(function setRunningToZero () {
          q._running = 0
        }, 500)
      }

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        q._running = 1
        q._masterInterval = 300
        dbReview.enable(q)
        return q.ready()
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(q), 'Review is enabled')
        t.ok(q._changeFeedCursor.connection.open, 'Change feed is connected')
        t.notOk(q.paused, 'Queue is not paused')
        addEventHandlers()

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

        // ---------- Stop without Drain ----------
        t.comment('queue-stop: Stop without Drain')
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

        // ---------- Clean Up ----------
        removeEventHandlers()
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
