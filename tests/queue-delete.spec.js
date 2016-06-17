const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testMockQueue = require('./test-mock-queue')
const testQueue = require('./test-queue')
const queueDelete = require('../src/queue-delete')
const enums = require('../src/enums')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-delete test', (t) => {
      t.plan(8)

      const mockQueue = testMockQueue()
      let q = testQueue()

      function deletedEventHandler () {
        t.pass('Queue deleted event raised')
        this.removeListener(enums.queueStatus.deleted, deletedEventHandler)
      }
      q.on(enums.queueStatus.deleted, deletedEventHandler)

      q.ready.then(() => {
        t.pass('Queue in a ready state')
        q.running = 1
        // ---------- Delete Queue Forcefully ----------
        return queueDelete(q, 500)
      }).then((deleteResult) => {
        t.ok(deleteResult, 'Queue deleted Forcefully')
        return mockQueue.r.db(mockQueue.db).tableList()
      }).then((tableList) => {
        t.notOk(tableList.includes(mockQueue.name), 'Table deleted from database')
        q = testQueue(true)
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        setTimeout((q) => { q.running = 0 }, 200, q)
        // ---------- Delete Queue Gracefully ----------
        return queueDelete(q, 500)
      }).then((deleteResult) => {
        t.ok(deleteResult, 'Queue deleted gracefully')
        return mockQueue.r.db(mockQueue.db).tableList()
      }).then((tableList) => {
        t.notOk(tableList.includes(mockQueue.name), 'Table deleted from database')
        q = testQueue(true)
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        return resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
