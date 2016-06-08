const test = require('tape')
const testQueue = require('./test-queue')
const dbChanges = require('../src/db-changes')
const testData = require('./test-options').testData

test('db-changes test', (t) => {
  t.plan(2)

  let job = testQueue.createJob(testData)
  let jobAsData = job.cleanCopy
  let mockChange = {
    changes: [
      {
        new_val: jobAsData
      }
    ],
    errors: 0
  }
  dbChanges.toJob(testQueue, mockChange).then((changeJob) => {
    t.deepEqual(jobAsData, job.cleanCopy, 'Job created from change successfully')
    mockChange.errors = 1
    return dbChanges.toJob(testQueue, mockChange)
  }).then(() => {
    t.fail('Change with error not failing')
  }).catch((err) => {
    t.deepEqual(mockChange, err, 'Change with error failing')
  }).catch(err => t.fail(err))
})
