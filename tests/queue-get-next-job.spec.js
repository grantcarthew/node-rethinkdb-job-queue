const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const dbResult = require('../src/db-result')
const queueGetJob = require('../src/queue-get-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-get-job test', (t) => {
      t.plan(2)

      const q = testQueue()
      const job = q.createJob(testData)
      let savedJob

      return q.addJob(job)
      .then((savedJobs) => {
        savedJob = savedJobs[0]

        t.equal(savedJob.id, job.id, 'Job saved successfully')
        return queueGetJob(q, savedJob.id)
      }).then((retrievedJob) => {
        t.deepEqual(retrievedJob[0], savedJob, 'Job retrieved successfully')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
