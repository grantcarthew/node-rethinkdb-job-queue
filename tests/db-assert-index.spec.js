const test = require('tape')
const Promise = require('bluebird')
const testMockQueue = require('./test-mock-queue')
const dbAssertIndex = require('../src/db-assert-index')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-index test', (t) => {
      t.plan(1)

      const q = testMockQueue()

      return dbAssertIndex(q)
      .then((assertIndexResult) => {
        t.ok(assertIndexResult, 'Indexes asserted')
        resolve()
      }).catch(err => t.fail(err))
    })
  })
}
