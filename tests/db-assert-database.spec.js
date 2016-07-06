const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testMockQueue = require('./test-mock-queue')
const dbAssertDatabase = require('../src/db-assert-database')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-assert-database', (t) => {
      t.plan(1)

      const q = testMockQueue()
      return dbAssertDatabase(q).then((assertDbResult) => {
        t.ok(assertDbResult, 'Database asserted')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
