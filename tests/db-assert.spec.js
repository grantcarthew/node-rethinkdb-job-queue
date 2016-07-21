const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const dbAssert = require('../src/db-assert')
const testMockQueue = require('./test-mock-queue')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-assert', (t) => {
      t.plan(1)

      const q = testMockQueue()

      return dbAssert(q).then((dbResult) => {
        t.ok(dbResult, 'All database resources asserted')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
