const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const enums = require('../src/enums')
const dbResult = require('../src/db-result')
const testData = require('./test-options').testData
const Queue = require('../src/queue')
const testOptions = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-result', (t) => {
      t.plan(28)

      const q = new Queue(testOptions.default())
      const job1 = q.createJob().setPayload(testData)
      const job2 = q.createJob().setPayload(testData)
      const job3 = q.createJob().setPayload(testData)
      const mockArray = [
        job1.getCleanCopy(),
        job2.getCleanCopy(),
        job3.getCleanCopy()
      ]
      const mockChange = {
        changes: [
          {
            new_val: job1.getCleanCopy()
          },
          {
            new_val: job2.getCleanCopy()
          },
          {
            new_val: job3.getCleanCopy()
          }
        ],
        errors: 1
      }
      const mockSingleChange = {
        new_val: job1.getCleanCopy(),
        what: '?'
      }

      // ---------- Invalid Parameters Tests ----------
      t.comment('db-result: Invalid Parameters')
      return dbResult.toJob(q).then((undefinedResult) => {
        t.equal(undefinedResult.length, 0, 'Undefined db result returns empty array')
        return dbResult.toJob(q, mockChange).then((noErr) => {
          t.fail('Does not fail if errors exist in db result')
        }).catch((err) => {
          t.equal(err.message, enums.message.dbError, 'Returns rejected Promise on error in toJobs')
        })
      }).then(() => {
        return dbResult.toIds(mockChange).then((noErr) => {
          t.fail('Does not fail if errors exist in db result')
        }).catch((err) => {
          t.equal(err.message, enums.message.dbError, 'Returns rejected Promise on error in toIds')
        })
      }).then(() => {
        mockChange.errors = 0

        // ---------- toJob Tests ----------
        t.comment('db-result: toJobs')
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
        t.deepEqual(singleResult[0].getCleanCopy(), job1.getCleanCopy(), 'Single returned job is valid')
        return dbResult.toJob(q, job1.getCleanCopy())
      }).then((jobResult) => {
        t.equal(jobResult.length, 1, 'Job data returns jobs array')
        t.deepEqual(jobResult[0].getCleanCopy(), job1.getCleanCopy(), 'Job data returned job is valid')

        // ---------- toIds Tests ----------
        t.comment('db-result: toIds')
        return dbResult.toIds(mockChange)
      }).then((changeResult) => {
        t.equal(changeResult.length, 3, 'DB result with changes returns ids array')
        t.equal(changeResult[0], job1.id, 'First returned id is valid')
        t.equal(changeResult[1], job2.id, 'Second returned id is valid')
        t.equal(changeResult[2], job3.id, 'Third returned id is valid')
        return dbResult.toIds(mockArray)
      }).then((arrayResult) => {
        t.equal(arrayResult.length, 3, 'Array of data returns ids array')
        t.equal(arrayResult[0], job1.id, 'First returned id is valid')
        t.equal(arrayResult[1], job2.id, 'Second returned id is valid')
        t.equal(arrayResult[2], job3.id, 'Third returned id is valid')
        return dbResult.toIds(mockSingleChange)
      }).then((singleResult) => {
        t.equal(singleResult.length, 1, 'Single change returns ids array')
        t.deepEqual(singleResult[0], job1.id, 'Single returned id is valid')
        return dbResult.toIds(job1.getCleanCopy())
      }).then((jobResult) => {
        t.equal(jobResult.length, 1, 'Job data returns ids array')
        t.deepEqual(jobResult[0], job1.id, 'Job data returned id is valid')

        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        return resolve(t.end())
      }).catch(err => testError(err, module, t))
    })
  })
}
