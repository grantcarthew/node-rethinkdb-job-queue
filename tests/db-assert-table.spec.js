const test = require('tape')
const Promise = require('bluebird')
const tError = require('./test-error')
const dbAssertTable = require('../src/db-assert-table')
const tOpts = require('./test-options')
const rethinkdbdash = require('rethinkdbdash')

module.exports = function () {
  const q = {
    r: rethinkdbdash(tOpts.cxn()),
    db: tOpts.dbName,
    name: tOpts.queueName,
    id: 'mock:queue:id'
  }

  return new Promise((resolve, reject) => {
    test('db-assert-table', (t) => {
      t.plan(1)

      return dbAssertTable(q).then((assertDbTable) => {
        t.ok(assertDbTable, 'Table asserted')
        q.r.getPoolMaster().drain()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
