const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const dbResult = require('../src/db-result')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-result test', (t) => {
      t.plan(14)

      const q = testQueue()
      const job1 = q.createJob(testData)
      const job2 = q.createJob(testData)
      const job3 = q.createJob(testData)
      const mockArray = [
        job1.cleanCopy,
        job2.cleanCopy,
        job3.cleanCopy
      ]
      const mockChange = {
        changes: [
          {
            new_val: job1.cleanCopy
          },
          {
            new_val: job2.cleanCopy
          },
          {
            new_val: job3.cleanCopy
          }
        ],
        errors: 1
      }
      const mockSingleChange = {
        new_val: job1.cleanCopy,
        what: '?'
      }

      return dbResult.toJob(q).then((undefinedResult) => {
        t.equal(undefinedResult.length, 0, 'Undefined db result returns empty array')
        return dbResult.toJob(q, mockChange).then((noErr) => {
          t.fail('Does not fail if errors exist in db result')
        }).catch((err) => {
          t.deepEqual(err, mockChange, 'Returns rejected Promise on error')
        })
      }).then(() => {
        mockChange.errors = 0
        return dbResult.toJob(q, mockChange)
      }).then((changeResult) => {
        t.equal(changeResult.length, 3, 'DB result with changes returns jobs array')
        t.equal(changeResult[0].id, job1.id, 'First returned job is valid')
        t.equal(changeResult[1].id, job2.id, 'Second returned job is valid')
        t.equal(changeResult[2].id, job3.id, 'Third returned job is valid')
        return dbResult.toJob(q, mockArray)
      }).then((arrayResult) => {
        t.equal(arrayResult.length, 3, 'Array of data returns jobs array')
        t.equal(arrayResult[0].id, job1.id, 'First returned job is valid')
        t.equal(arrayResult[1].id, job2.id, 'Second returned job is valid')
        t.equal(arrayResult[2].id, job3.id, 'Third returned job is valid')
        return dbResult.toJob(q, mockSingleChange)
      }).then((singleResult) => {
        t.equal(singleResult.length, 1, 'Single change returns jobs array')
        t.deepEqual(singleResult[0].cleanCopy, job1.cleanCopy, 'Single returned job is valid')
        return dbResult.toJob(q, job1.cleanCopy)
      }).then((jobResult) => {
        t.equal(jobResult.length, 1, 'Job data returns jobs array')
        t.deepEqual(jobResult[0].cleanCopy, job1.cleanCopy, 'Job data returned job is valid')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
