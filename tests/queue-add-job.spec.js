const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const queueAddJob = require('../src/queue-add-job')
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-add-job'

queueAddJobTests()
function queueAddJobTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(51)

      const q = new Queue(tOpts.cxn(), tOpts.default('queueAddJob'))

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 0,
        progress: 0,
        pausing: 0,
        paused: 0,
        resumed: 0,
        removed: 0,
        reset: 0,
        error: 0,
        reviewed: 0,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 3,
        waiting: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
        terminated: 0,
        reanimated: 0,
        log: 0,
        updated: 0
      }

      const job = q.createJob()
      const jobs = [
        q.createJob(),
        q.createJob()
      ]

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        eventHandlers.add(t, q, state)

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
        t.equal(jobsFromDb[0].log[0].status, enums.status.waiting, 'Log job 1 status is added')
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
        t.equal(jobsFromDb2[0].log[0].status, enums.status.waiting, 'Log job 2 status is added')
        t.equal(jobsFromDb2[0].retryCount, 0, 'Log job 2 retryCount is valid')
        t.equal(jobsFromDb2[0].log[0].message, enums.message.jobAdded, 'Log job 2 message is valid')
        return q.getJob(jobs[1].id)
      }).then((jobsFromDb3) => {
        t.ok(is.date(jobsFromDb3[0].log[0].date), 'Log job 3 date is a date')
        t.equal(jobsFromDb3[0].log[0].queueId, q.id, 'Log job 3 queueId is valid')
        t.equal(jobsFromDb3[0].log[0].type, enums.log.information, 'Log job 3 type is information')
        t.equal(jobsFromDb3[0].log[0].status, enums.status.waiting, 'Log job 3 status is added')
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
        //
        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
