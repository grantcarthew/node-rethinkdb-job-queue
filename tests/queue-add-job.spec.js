const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const enums = require('../src/enums')
const queueAddJob = require('../src/queue-add-job')
const testData = require('./test-options').testData
const Queue = require('../src/queue')
const testOptions = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-add-job', (t) => {
      t.plan(30)

      const q = new Queue(testOptions.default())
      let addedCount = 0
      function addedEventHandler (jobId) {
        addedCount++
        t.ok(is.uuid(jobId), `Event: Job Added [${addedCount}] [${jobId}]`)
      }
      q.on(enums.status.added, addedEventHandler)

      const job = q.createJob()
      const jobs = [
        q.createJob(),
        q.createJob()
      ]

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')

        // ---------- Add Single Job Tests ----------
        t.comment('queue-add-job: Add Single Job')
        return queueAddJob(q, job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job 1 saved successfully')
        return q.getJob(job.id)
      }).then((jobsFromDb) => {
        t.ok(is.date(jobsFromDb[0].log[0].date), 'Log job 1 date is a date')
        t.equal(jobsFromDb[0].log[0].queueId, q.id, 'Log job 1 queueId is valid')
        t.equal(jobsFromDb[0].log[0].type, enums.log.information, 'Log job 1 type is information')
        t.equal(jobsFromDb[0].log[0].status, enums.status.added, 'Log job 1 status is added')
        t.equal(jobsFromDb[0].retryCount, 0, 'Log job 1 retryCount is valid')
        t.equal(jobsFromDb[0].log[0].message, enums.message.jobAdded, 'Log job 1 message is valid')

        // ---------- Add Multiple Jobs Tests ----------
        t.comment('queue-add-job: Add Multiple Job')
        return queueAddJob(q, jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs[0].id, jobs[0].id, 'Job 2 saved successfully')
        t.equal(savedJobs[1].id, jobs[1].id, 'Job 3 saved successfully')

        return q.getJob(jobs[0].id)
      }).then((jobsFromDb2) => {
        t.ok(is.date(jobsFromDb2[0].log[0].date), 'Log job 2 date is a date')
        t.equal(jobsFromDb2[0].log[0].queueId, q.id, 'Log job 2 queueId is valid')
        t.equal(jobsFromDb2[0].log[0].type, enums.log.information, 'Log job 2 type is information')
        t.equal(jobsFromDb2[0].log[0].status, enums.status.added, 'Log job 2 status is added')
        t.equal(jobsFromDb2[0].retryCount, 0, 'Log job 2 retryCount is valid')
        t.equal(jobsFromDb2[0].log[0].message, enums.message.jobAdded, 'Log job 2 message is valid')
        return q.getJob(jobs[1].id)
      }).then((jobsFromDb3) => {
        t.ok(is.date(jobsFromDb3[0].log[0].date), 'Log job 3 date is a date')
        t.equal(jobsFromDb3[0].log[0].queueId, q.id, 'Log job 3 queueId is valid')
        t.equal(jobsFromDb3[0].log[0].type, enums.log.information, 'Log job 3 type is information')
        t.equal(jobsFromDb3[0].log[0].status, enums.status.added, 'Log job 3 status is added')
        t.equal(jobsFromDb3[0].retryCount, 0, 'Log job 3 retryCount is valid')
        t.equal(jobsFromDb3[0].log[0].message, enums.message.jobAdded, 'Log job 3 message is valid')
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
          t.ok(err.message.includes(enums.message.jobInvalid), 'Job invalid returns a rejected promise')
        })
      }).then(() => {
        job.status = enums.status.added

        // ---------- Add Invalid Status Job Tests ----------
        t.comment('queue-add-job: Add Invalid Status Job')
        return queueAddJob(q, job).then(() => {
          t.fail('Promise is not being rejected when job status is invalid')
        }).catch((err) => {
          t.equal(err.message, enums.message.jobAlreadyAdded, 'Job with status not equal to created returns a rejected promise')
        })
      }).then(() => {
        t.equal(addedCount, 3, 'Jobs added event count is valid')
        q.removeListener(enums.status.added, addedEventHandler)
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        return resolve(t.end())
      }).catch(err => testError(err, module, t))
    })
  })
}
