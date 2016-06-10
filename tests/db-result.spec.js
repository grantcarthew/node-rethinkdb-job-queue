const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const dbResult = require('../src/db-result')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-result test', (t) => {
      t.plan(2)

      const q = testQueue()
      const job = q.createJob(testData)
      const jobAsData = job.cleanCopy
      const mockChange = {
        changes: [
          {
            new_val: jobAsData
          }
        ],
        errors: 0
      }
      return dbResult.toJob(q, mockChange).then((changeJob) => {
        t.deepEqual(jobAsData, job.cleanCopy, 'Job created from change successfully')
        mockChange.errors = 1
        return dbResult.toJob(q, mockChange)
      }).then(() => {
        t.fail('Change with error not failing')
      }).catch((err) => {
        t.deepEqual(mockChange, err, 'Change with error failing')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
