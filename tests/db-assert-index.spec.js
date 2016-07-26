const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const dbAssertIndex = require('../src/db-assert-index')
const testOptions = require('./test-options')
const rethinkdbdash = require('rethinkdbdash')
const q = {
  r: rethinkdbdash(testOptions.connection),
  db: testOptions.dbName,
  name: testOptions.queueName,
  id: 'mock:queue:id'
}

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-index', (t) => {
      t.plan(1)

      return dbAssertIndex(q).then((assertIndexResult) => {
        t.ok(assertIndexResult, 'Indexes asserted')
        q.r.getPoolMaster().drain()
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
