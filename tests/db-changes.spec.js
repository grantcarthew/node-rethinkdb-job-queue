const test = require('tape')
const Promise = require('bluebird')
const testQueue = require('./test-queue')
const dbChanges = require('../src/db-changes')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-changes test', (t) => {
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
      dbChanges.toJob(q, mockChange).then((changeJob) => {
        t.deepEqual(jobAsData, job.cleanCopy, 'Job created from change successfully')
        mockChange.errors = 1
        return dbChanges.toJob(q, mockChange)
      }).then(() => {
        t.fail('Change with error not failing')
      }).catch((err) => {
        t.deepEqual(mockChange, err, 'Change with error failing')
        resolve()
      }).catch(err => t.fail(err))
    })
  })
}
