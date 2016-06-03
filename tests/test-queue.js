const Queue = require('../src/queue')
const testOptions = require('./test-options')
const testQ = new Queue(testOptions.queueDefaultOptions)

module.exports = testQ
