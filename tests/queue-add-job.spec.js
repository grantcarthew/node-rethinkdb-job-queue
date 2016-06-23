const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const queueAddJob = require('../src/queue-add-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-add-job test', (t) => {
      t.plan(7)

      const q = testQueue()
      const job = q.createJob(testData)
      const jobs = [
        q.createJob(testData),
        q.createJob(testData)
      ]

      queueAddJob(q, job).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job 1 saved successfully')
        return queueAddJob(q, jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs[0].id, jobs[0].id, 'Job 2 saved successfully')
        t.equal(savedJobs[1].id, jobs[1].id, 'Job 3 saved successfully')
      }).then(() => {
        return queueAddJob(q)
      }).then((nullJobResult) => {
        t.equal(nullJobResult.length, 0,
          'Job null or undefined returns an empty array')
        return queueAddJob(q, {}).then(() => {
          t.fail('Job invalid is not returning a rejected promise')
        }).catch((err) => {
          t.ok(err.message.includes(enums.error.jobInvalid), 'Job invalid returns a rejected promise')
        })
      }).then(() => {
        job.status = 'waiting'
        return queueAddJob(q, job).then(() => {
          t.fail('Promise is not being rejected when job status is invalid')
        }).catch((err) => {
          t.equal(err, enums.error.jobAlreadyAdded, 'Job with status not equal to created returns a rejected promise')
        })
      }).then(() => {
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
