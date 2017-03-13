const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const queueCancelJob = require('../src/queue-cancel-job')
const tData = require('./test-options').tData
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-cancel-job'

queueCancelJobTests()
function queueCancelJobTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(70)

      const q = new Queue(tOpts.cxn(), tOpts.default('queueCancelJob'))

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
        removed: 5,
        reset: 1,
        error: 0,
        reviewed: 0,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 6,
        waiting: 0,
        active: 0,
        completed: 0,
        cancelled: 11,
        failed: 0,
        terminated: 0,
        reanimated: 0,
        log: 0,
        updated: 0
      }

      const jobsToCreate = 5
      let jobs = []
      for (let i = 0; i < jobsToCreate; i++) {
        jobs.push(q.createJob())
      }
      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, jobsToCreate, 'Jobs saved successfully')

        // ---------- Cancel Multiple Jobs Tests ----------
        eventHandlers.add(t, q, state)
        t.comment('queue-cancel-job: Cancel Multiple Jobs')
        return queueCancelJob(q, savedJobs, tData)
      }).then((cancelResult) => {
        t.equal(cancelResult.length, jobsToCreate, 'Job cancelled successfully')
        jobs = q.createJob()
        return q.addJob(jobs)
      }).then((singleJob) => {
        t.equal(singleJob[0].id, jobs.id, 'Jobs saved successfully')

        // ---------- Cancel Single Job Tests ----------
        t.comment('queue-cancel-job: Cancel Single Job')
        return queueCancelJob(q, singleJob[0], tData)
      }).then((cancelledJobId) => {
        t.ok(is.uuid(cancelledJobId[0]), 'Cancel Job returned Id')
        return q.getJob(cancelledJobId)
      }).then((cancelledJob) => {
        t.equal(cancelledJob[0].status, enums.status.cancelled, 'Job status is cancelled')
        t.ok(is.date(cancelledJob[0].dateFinished), 'Job dateFinished is a date')
        t.equal(cancelledJob[0].queueId, q.id, 'Job queueId is valid')
        t.equal(cancelledJob[0].log.length, 2, 'Job log exists')
        t.ok(is.date(cancelledJob[0].log[1].date), 'Log date is a date')
        t.equal(cancelledJob[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(cancelledJob[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(cancelledJob[0].log[1].status, enums.status.cancelled, 'Log status is cancelled')
        t.ok(cancelledJob[0].log[1].retryCount >= 0, 'Log retryCount is valid')
        t.equal(cancelledJob[0].log[1].message, tData, 'Log message is present')

        // ---------- Cancel Multiple Jobs with Remove Tests ----------
        t.comment('queue-cancel-job: Cancel Multiple Jobs with Remove')
        jobs = []
        for (let i = 0; i < jobsToCreate; i++) {
          jobs.push(q.createJob())
        }
        q._removeFinishedJobs = true
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, jobsToCreate, 'Jobs saved successfully')
        return queueCancelJob(q, savedJobs, tData)
      }).then((cancelResult) => {
        t.equal(cancelResult.length, 5, 'Cancel Job returned valid number of Ids')
        cancelResult.forEach((jobId) => {
          t.ok(is.uuid(jobId), 'Cancel job returned item is a valid Id')
        })
        return q.getJob(cancelResult)
      }).then((cancelledJobs) => {
        t.equal(cancelledJobs.length, 0, 'Cancelled jobs not in database')
      }).then(() => {
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)

        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
