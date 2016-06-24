const Queue = require('../src/queue')
const testOptions = require('./test-options')
let testQueue

module.exports = function (options) {
  let defaults = testOptions.queueDefault()
  if (options) { defaults = options }
  if (options || !testQueue) {
    if (testQueue) { testQueue.stop(100) }
    testQueue = new Queue(defaults)
  }
  return testQueue
}
