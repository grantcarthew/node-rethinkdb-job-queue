const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const queueGetJob = require('../src/queue-get-job')
const enums = require('../src/enums')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-get-job test', (t) => {
      t.plan(12)

      const q = testQueue()
      const job1 = q.createJob(testData)
      const job2 = q.createJob(testData)
      const job3 = q.createJob(testData)
      const jobs = [
        job1,
        job2,
        job3
      ]
      let jobsSaved

      return q.addJob(jobs)
      .then((savedJobs) => {
        jobsSaved = savedJobs
        t.equal(savedJobs.length, 3, 'Job saved successfully')
        return queueGetJob(q)
      }).then((undefinedResult) => {
        t.ok(Array.isArray(undefinedResult), 'Undefined returns an Array')
        t.equal(undefinedResult.length, 0, 'Undefined returns an empty Array')
        return queueGetJob(q, ['invalid id']).catch((err) => {
          t.ok(err.message.includes(enums.error.idInvalid), 'Invalid id returns rejected Promise')
        })
      }).then((empty) => {
        return queueGetJob(q, [])
      }).then((empty) => {
        t.equal(empty.length, 0, 'Empty array returns empty array')
        return queueGetJob(q, job1.id)
      }).then((retrievedJob) => {
        t.equal(retrievedJob.length, 1, 'One jobs retrieved')
        t.deepEqual(retrievedJob[0], jobsSaved[0], 'Job retrieved successfully')
        return queueGetJob(q, [job1.id, job2.id, job3.id])
      }).then((retrievedJobs) => {
        const retrievedIds = retrievedJobs.map(j => j.id)
        t.equal(retrievedJobs.length, 3, 'Three jobs retrieved')
        t.ok(retrievedIds.includes(retrievedJobs[0].id), 'Job 1 retrieved successfully')
        t.ok(retrievedIds.includes(retrievedJobs[1].id), 'Job 2 retrieved successfully')
        t.ok(retrievedIds.includes(retrievedJobs[2].id), 'Job 3 retrieved successfully')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
