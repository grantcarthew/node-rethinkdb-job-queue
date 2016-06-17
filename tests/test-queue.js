const Queue = require('../src/queue')
const testOptions = require('./test-options')
let testQueue

module.exports = function (newNeeded) {
  if (!testQueue || newNeeded) {
    testQueue = new Queue(testOptions.queueDefault())
  }
  return testQueue
}
