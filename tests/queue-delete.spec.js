const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const enums = require('../src/enums')
const testError = require('./test-error')
const testMockQueue = require('./test-mock-queue')
const testQueue = require('./test-queue')
const testOptionsDefault = require('./test-options').queueDefault()
const queueDelete = require('../src/queue-delete')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-delete', (t) => {
      t.plan(8)

      const mockQueue = testMockQueue()
      let q = testQueue()

      function deletedEventHandler () {
        t.pass('Event: Queue deleted')
        this.removeListener(enums.status.deleted, deletedEventHandler)
      }
      q.on(enums.status.deleted, deletedEventHandler)

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        q.running = 1

        // ---------- Delete Queue Forcefully ----------
        t.comment('queue-delete: Delete Queue Forcefully')
        return queueDelete(q, 500)
      }).then((deleteResult) => {
        t.ok(deleteResult, 'Queue deleted Forcefully')
        return mockQueue.r.db(mockQueue.db).tableList()
      }).then((tableList) => {
        t.notOk(tableList.includes(mockQueue.name), 'Table deleted from database')
        q = testQueue(testOptionsDefault)
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        setTimeout((q) => { q.running = 0 }, 200, q)

        // ---------- Delete Queue Gracefully ----------
        t.comment('queue-delete: Delete Queue Gracefully')
        return queueDelete(q, 500)
      }).then((deleteResult) => {
        t.ok(deleteResult, 'Queue deleted gracefully')
        return mockQueue.r.db(mockQueue.db).tableList()
      }).then((tableList) => {
        t.notOk(tableList.includes(mockQueue.name), 'Table deleted from database')
        q = testQueue(testOptionsDefault)
        return q.ready
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        return resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
