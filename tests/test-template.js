const test = require('tape')
const Promise = require('bluebird')
const testQueue = require('./test-queue')
const dbResult = require('../src/db-result')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('XXXXXXXXXXXX test', (t) => {
      t.plan(1)

      const q = testQueue()
      const job = q.createJob(testData)
      return YYYYYY().then((ZZZZZZZ) => {
        t.deepEqual(, , 'Blah successfully')
      }).catch((err) => {
        t.deepEqual(, , 'Blah failing')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
