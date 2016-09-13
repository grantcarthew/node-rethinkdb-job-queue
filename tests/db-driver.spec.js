const test = require('tape')
const testError = require('./test-error')
const testOptions = require('./test-options')
const dbDriver = require('../src/db-driver')
const rethinkdbdash = require('rethinkdbdash')

module.exports = function () {
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
        hostOnly: { host: testOptions.dbHost },
        portOnly: { port: testOptions.dbPort },
        dbOnly: { db: testOptions.dbName },
        full: testOptions.connection()
      }
      options.full.silent = true

      testConnOptions()
      testConnOptions(options.hostObnly)
      testConnOptions(options.portOnly)
      testConnOptions(options.dbOnly)
      testConnOptions(testOptions.connection())

      const dash = rethinkdbdash(options.full)
      const dashResult = dbDriver(dash)
      t.ok(dash === dashResult, 'DB driver rethinkdbdash returns rethinkdbdash')
      dash.getPoolMaster().drain()

      t.throws(() => { dbDriver({foo: 'bar'}) }, 'Invalid db driver options throws an error')
    } catch (err) {
      testError(err, module, t)
    }
  })
}
