const rethinkdbdash = require('rethinkdbdash')
const testOptions = require('./test-options')
let mockQueue

module.exports = function () {
  if (!mockQueue) {
    mockQueue = {
      r: rethinkdbdash(testOptions.connectionOptions),
      db: testOptions.dbName,
      name: testOptions.queueName,
      id: 'mock:queue:id'
    }
  }
  return mockQueue
}
