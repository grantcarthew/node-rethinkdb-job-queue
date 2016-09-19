const test = require('tape')
const Promise = require('bluebird')
const tError = require('./test-error')
const dbAssertIndex = require('../src/db-assert-index')
const dbDriver = require('../src/db-driver')
const tOpts = require('./test-options')

module.exports = function () {
  const q = {
    r: dbDriver(tOpts.cxn()),
    db: tOpts.dbName,
    name: tOpts.queueName,
    id: 'mock:queue:id'
  }

  return new Promise((resolve, reject) => {
    test('db-assert-index', (t) => {
      t.plan(1)

      return dbAssertIndex(q).then((assertIndexResult) => {
        t.ok(assertIndexResult, 'Indexes asserted')
        q.r.getPoolMaster().drain()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
