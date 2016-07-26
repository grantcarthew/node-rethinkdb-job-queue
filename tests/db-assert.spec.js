const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const dbAssert = require('../src/db-assert')
const testOptions = require('./test-options')
const rethinkdbdash = require('rethinkdbdash')

module.exports = function () {
  const q = {
    r: rethinkdbdash(testOptions.connection()),
    db: testOptions.dbName,
    name: testOptions.queueName,
    id: 'mock:queue:id'
  }

  return new Promise((resolve, reject) => {
    test('db-assert', (t) => {
      t.plan(1)

      return dbAssert(q).then((dbResult) => {
        t.ok(dbResult, 'All database resources asserted')
        q.r.getPoolMaster().drain()
        return resolve(t.end())
      }).catch(err => testError(err, module, t))
    })
  })
}
