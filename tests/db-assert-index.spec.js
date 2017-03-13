const test = require('tap').test
const Promise = require('bluebird')
const tError = require('./test-error')
const dbAssertDatabase = require('../src/db-assert-database')
const dbAssertTable = require('../src/db-assert-table')
const dbAssertIndex = require('../src/db-assert-index')
const dbDriver = require('../src/db-driver')
const tOpts = require('./test-options')

dbAssertIndexTests()
function dbAssertIndexTests () {
  const q = {
    r: dbDriver(tOpts.cxn()),
    db: tOpts.dbName,
    name: 'dbAssertIndex',
    id: 'mock:queue:id'
  }

  return new Promise((resolve, reject) => {
    test('db-assert-index', (t) => {
      t.plan(3)

      return dbAssertDatabase(q).then((assertDbResult) => {
        t.ok(assertDbResult, 'Database asserted')
        return dbAssertTable(q)
      }).then((assertDbTable) => {
        t.ok(assertDbTable, 'Table asserted')
        return dbAssertIndex(q)
      }).then((assertIndexResult) => {
        t.ok(assertIndexResult, 'Indexes asserted')
        q.r.getPoolMaster().drain()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
