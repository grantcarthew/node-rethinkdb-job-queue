const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const queueAddJob = require('../src/queue-add-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-add-job', (t) => {
      t.plan(12)

      const q = testQueue()
      let addedCount = 0
      function addedEventHandler (job) {
        addedCount++
        t.ok(is.job(job), `Event: Job Added [${addedCount}] [${job.id}]`)
      }
      q.on(enums.status.added, addedEventHandler)

      const job = q.createJob(testData)
      const jobs = [
        q.createJob(testData),
        q.createJob(testData)
      ]

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')

        // ---------- Add Single Job Tests ----------
        t.comment('queue-add-job: Add Single Job')
        return queueAddJob(q, job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job 1 saved successfully')

        // ---------- Add Multiple Jobs Tests ----------
        t.comment('queue-add-job: Add Multiple Job')
        return queueAddJob(q, jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs[0].id, jobs[0].id, 'Job 2 saved successfully')
        t.equal(savedJobs[1].id, jobs[1].id, 'Job 3 saved successfully')
      }).then(() => {
        //
        // ---------- Add Null Job Tests ----------
        t.comment('queue-add-job: Add Null Job')
        return queueAddJob(q)
      }).then((nullJobResult) => {
        t.equal(nullJobResult.length, 0,
          'Job null or undefined returns an empty array')

        // ---------- Add Invalid Job Tests ----------
        t.comment('queue-add-job: Add Invalid Job')
        return queueAddJob(q, {}).then(() => {
          t.fail('Job invalid is not returning a rejected promise')
        }).catch((err) => {
          t.ok(err.message.includes(enums.error.jobInvalid), 'Job invalid returns a rejected promise')
        })
      }).then(() => {
        job.status = 'waiting'

        // ---------- Add Invalid Status Job Tests ----------
        t.comment('queue-add-job: Add Invalid Status Job')
        return queueAddJob(q, job).then(() => {
          t.fail('Promise is not being rejected when job status is invalid')
        }).catch((err) => {
          t.equal(err.message, enums.error.jobAlreadyAdded, 'Job with status not equal to created returns a rejected promise')
        })
      }).then(() => {
        t.equal(addedCount, 3, 'Jobs added event count is valid')
        q.removeListener(enums.status.added, addedEventHandler)
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
