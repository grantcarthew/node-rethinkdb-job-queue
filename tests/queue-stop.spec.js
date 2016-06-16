const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const queueStop = require('../src/queue-stop')
const dbReview = require('../src/db-review')
const enums = require('../src/enums')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-stop test', (t) => {
      t.plan(11)

      const q = testQueue()
      q.ready.then(() => {
        q.running = 1
        q.isMaster = true
        return q.review(true)
      }).then(() => {
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        return queueStop(q, 500, true)
      }).then((forceStopMessage) => {
        t.pass('Stop forced after timeout')
        t.equal(forceStopMessage, enums.message.failedToStop, 'Stop return message is valid')
        t.notOk(dbReview.isEnabled(), 'Review is disabled')
        t.notOk(q._changeFeed, 'Change feed is disconnected')
        t.notOk(q.ready, 'Queue is not ready')
        q.attachToDb()
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        t.ok(dbReview.isEnabled(), 'Review is enabled')
        t.ok(q._changeFeed.connection.open, 'Change feed is connected')
        setTimeout((q) => { q.running = 0 }, 200, q)
        return queueStop(q, 500, true)
      }).then((jobsStoppedMessage) => {
        t.equal(jobsStoppedMessage, enums.message.allJobsStopped, 'Queue stopped gracefully')
        return resolve()
      })
    })
  })
}
