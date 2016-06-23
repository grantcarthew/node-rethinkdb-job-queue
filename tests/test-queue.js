const Queue = require('../src/queue')
const testOptions = require('./test-options')
let testQueue

module.exports = function (newNeeded, options) {
  if (!options) { options = testOptions.queueDefault() }
  if (newNeeded || !testQueue) {
    if (testQueue) { testQueue.stop(100) }
    testQueue = new Queue(testOptions.queueDefault())
  }
  return testQueue
}
