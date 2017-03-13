const test = require('tap').test
const tError = require('./test-error')
const tOpts = require('./test-options')
const dbDriver = require('../src/db-driver')
const rethinkdbdash = require('rethinkdbdash')

dbDriverTests()
function dbDriverTests () {
  test('db-driver', (t) => {
    t.plan(7)

    function testConnOptions (testOpt) {
      const driver = dbDriver(testOpt)
      testOpt = testOpt || {}
      t.ok(driver.getPoolMaster(), `DB driver option [${Object.keys(testOpt)}] returns rethinkdbdash`)
      driver.getPoolMaster().drain()
    }

    try {
      const options = {
        hostOnly: { host: tOpts.dbHost },
        portOnly: { port: tOpts.dbPort },
        dbOnly: { db: tOpts.dbName },
        full: tOpts.cxn()
      }
      options.full.silent = true

      testConnOptions()
      testConnOptions(options.hostObnly)
      testConnOptions(options.portOnly)
      testConnOptions(options.dbOnly)
      testConnOptions(tOpts.cxn())

      const dash = rethinkdbdash(options.full)
      const dashResult = dbDriver(dash)
      t.ok(dash === dashResult, 'DB driver rethinkdbdash returns rethinkdbdash')
      dash.getPoolMaster().drain()

      t.throws(() => { dbDriver({foo: 'bar'}) }, 'Invalid db driver options throws an error')
    } catch (err) {
      tError(err, module, t)
    }
  })
}
