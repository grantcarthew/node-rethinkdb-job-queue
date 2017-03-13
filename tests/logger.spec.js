const test = require('tap').test
const testName = 'logger'
let logger = require('../src/logger')

loggerTests()
function loggerTests () {
  test(testName, (t) => {
    t.plan(1)
    t.comment('logger test')
    let originalDebugValue = process.env.DEBUG
    process.env.DEBUG = '*'
    logger = logger(module)
    logger('Is this thing turned on?')
    process.env.DEBUG = originalDebugValue
    t.pass('test message logged in DEBUG mode')
  })
}
