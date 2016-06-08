const test = require('tape')
const Promise = require('bluebird')
const rethinkdbdash = require('rethinkdbdash')
const enums = require('../src/enums')
const dbAssert = require('../src/db-assert')
const testOptions = require('./test-options')
const mockQueue = {
  r: rethinkdbdash(testOptions.connectionOptions),
  db: testOptions.dbName,
  name: testOptions.queueName
}

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-assert test', (t) => {
      t.plan(1)
      return dbAssert(mockQueue).then((dbResult) => {
        t.ok(dbResult, 'Database asserted')
        resolve()
      }).catch(err => t.fail(err))
    })
  })
}
