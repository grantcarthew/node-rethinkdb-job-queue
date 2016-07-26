const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const dbAssertDatabase = require('../src/db-assert-database')
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
    test('db-assert-database', (t) => {
      t.plan(1)

      return dbAssertDatabase(q).then((assertDbResult) => {
        t.ok(assertDbResult, 'Database asserted')
        q.r.getPoolMaster().drain()
        return resolve(t.end())
      }).catch(err => testError(err, module, t))
    })
  })
}
