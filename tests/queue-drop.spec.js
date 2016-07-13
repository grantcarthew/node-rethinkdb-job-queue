const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const enums = require('../src/enums')
const testError = require('./test-error')
const testMockQueue = require('./test-mock-queue')
const testQueue = require('./test-queue')
const testOptionsDefault = require('./test-options').queueDefault()
const queueDrop = require('../src/queue-drop')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-drop', (t) => {
      t.plan(9)

      const mockQueue = testMockQueue()
      let q = testQueue()

      function droppedEventHandler (qid) {
        t.pass(`Event: Queue dropped [${qid}]`)
        t.equal(qid, q.id, `Event: Queue dropped id is valid`)
        this.removeListener(enums.status.dropped, droppedEventHandler)
      }
      q.on(enums.status.dropped, droppedEventHandler)

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        q.running = 1

        // ---------- Drop Queue Forcefully ----------
        t.comment('queue-drop: Drop Queue Forcefully')
        return queueDrop(q, 500)
      }).then((removeResult) => {
        t.ok(removeResult, 'Queue dropped Forcefully')
        return mockQueue.r.db(mockQueue.db).tableList()
      }).then((tableList) => {
        t.notOk(tableList.includes(mockQueue.name), 'Table dropped from database')
        q = testQueue(testOptionsDefault)
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        setTimeout((q) => { q.running = 0 }, 200, q)

        // ---------- Drop Queue Gracefully ----------
        t.comment('queue-drop: Drop Queue Gracefully')
        return queueDrop(q, 500)
      }).then((removeResult) => {
        t.ok(removeResult, 'Queue dropped gracefully')
        return mockQueue.r.db(mockQueue.db).tableList()
      }).then((tableList) => {
        t.notOk(tableList.includes(mockQueue.name), 'Table dropped from database')
        q = testQueue(testOptionsDefault)
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        return resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
