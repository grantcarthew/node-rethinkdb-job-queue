const test = require('tap').test
const Promise = require('bluebird')
const tError = require('./test-error')
const dbAssertDatabase = require('../src/db-assert-database')
const dbDriver = require('../src/db-driver')
const tOpts = require('./test-options')

dbAssertDatabaseTests()
function dbAssertDatabaseTests () {
  const q = {
    r: dbDriver(tOpts.cxn()),
    db: tOpts.dbName,
    name: 'dbAssertDatabase',
    id: 'mock:queue:id'
  }

  return new Promise((resolve, reject) => {
    test('db-assert-database', (t) => {
      t.plan(1)

      return dbAssertDatabase(q).then((assertDbResult) => {
        t.ok(assertDbResult, 'Database asserted')
        q.r.getPoolMaster().drain()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
