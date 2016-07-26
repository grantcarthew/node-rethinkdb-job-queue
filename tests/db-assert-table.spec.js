const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const dbAssertTable = require('../src/db-assert-table')
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
    test('db-assert-table', (t) => {
      t.plan(1)

      return dbAssertTable(q).then((assertDbTable) => {
        t.ok(assertDbTable, 'Table asserted')
        q.r.getPoolMaster().drain()
        return resolve(t.end())
      }).catch(err => testError(err, module, t))
    })
  })
}
