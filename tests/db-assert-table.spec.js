const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testMockQueue = require('./test-mock-queue')
const dbAssertTable = require('../src/db-assert-table')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-assert-table', (t) => {
      t.plan(1)

      const q = testMockQueue()

      return dbAssertTable(q).then((assertDbTable) => {
        t.ok(assertDbTable, 'Table asserted')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
