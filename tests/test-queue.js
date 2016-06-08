const Queue = require('../src/queue')
const testOptions = require('./test-options')
let testQ

module.exports = function () {
  if (!testQ) {
    testQ = new Queue(testOptions.queueDefault())
    return testQ
  }
  return testQ
}
