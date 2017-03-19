const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const jobLog = require('../src/job-log')
const tData = require('./test-options').tData
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'job-log'

jogLogTests()
function jogLogTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(76)

      const q = new Queue(tOpts.cxn(), tOpts.default('jobLog'))
      let job = q.createJob()
      job.detail = tData
      let logObject = { foo: 'bar' }

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
        reset: 1,
        error: 0,
        reviewed: 0,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 1,
        waiting: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
        terminated: 0,
        reanimated: 0,
        log: 4,
        updated: 0
      }

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        eventHandlers.add(t, q, state)
        return q.addJob(job)
      }).then((newJob) => {
        job = newJob[0]
        t.equal(job.status, enums.status.waiting, 'New job added successfully')

        // ---------- Add First Log Tests ----------
        t.comment('job-log: Add First Log')
        return jobLog.commitLog(job, tData, tData)
      }).then((updateResult1) => {
        t.ok(updateResult1, 'Log 1 added to job successfully')
        return q.getJob(job.id)
      }).then((jobWithLog1) => {
        t.equal(jobWithLog1[0].log.length, 2, 'Log 1 exists on retrieved job')
        t.ok(is.date(jobWithLog1[0].log[1].date), 'Log 1 date is a date')
        t.equal(jobWithLog1[0].log[1].queueId, q.id, 'Log 1 queueId is valid')
        t.equal(jobWithLog1[0].log[1].type, enums.log.information, 'Log 1 type is information')
        t.equal(jobWithLog1[0].log[1].status, enums.status.waiting, 'Log 1 status is added')
        t.ok(jobWithLog1[0].log[1].retryCount >= 0, 'Log retryCount is valid')
        t.ok(jobWithLog1[0].log[1].processCount >= 0, 'Log processCount is valid')
        t.equal(jobWithLog1[0].log[1].message, tData, 'Log 1 message is valid')
        t.equal(jobWithLog1[0].log[1].data, tData, 'Log 1 detail is valid')
        t.equal(jobWithLog1[0].getLastLog(), jobWithLog1[0].log[1], 'Last log entry is correctly retrieved')

        // ---------- Add Second Log Tests ----------
        t.comment('job-log: Add Second Log')
        return jobLog.commitLog(job, tData, tData)
      }).then((updateResult2) => {
        t.ok(updateResult2, 'Log 2 added to job successfully')
        return q.getJob(job.id)
      }).then((jobWithLog2) => {
        t.equal(jobWithLog2[0].log.length, 3, 'Log 2 exists on retrieved job')
        t.ok(is.date(jobWithLog2[0].log[2].date), 'Log 2 date is a date')
        t.equal(jobWithLog2[0].log[2].queueId, q.id, 'Log 2 queueId is valid')
        t.equal(jobWithLog2[0].log[2].type, enums.log.information, 'Log 2 type is information')
        t.equal(jobWithLog2[0].log[2].status, enums.status.waiting, 'Log 2 status is waiting')
        t.ok(jobWithLog2[0].log[2].retryCount >= 0, 'Log retryCount is valid')
        t.ok(jobWithLog2[0].log[2].processCount >= 0, 'Log processCount is valid')
        t.equal(jobWithLog2[0].log[2].message, tData, 'Log 2 message is valid')
        t.equal(jobWithLog2[0].log[2].data, tData, 'Log 2 data is valid')
        t.equal(jobWithLog2[0].getLastLog(), jobWithLog2[0].log[2], 'Last log entry is correctly retrieved')

        // ---------- Add Log with Defaults Tests ----------
        t.comment('job-log: Add Log with Defaults')
        return jobLog.commitLog(job)
      }).then((updateResult3) => {
        t.ok(updateResult3, 'Log 3 added to job successfully')
        return q.getJob(job.id)
      }).then((jobWithLog3) => {
        t.equal(jobWithLog3[0].log.length, 4, 'Log 3 exists on retrieved job')
        t.ok(is.date(jobWithLog3[0].log[3].date), 'Log 3 date is a date')
        t.equal(jobWithLog3[0].log[3].queueId, q.id, 'Log 3 queueId is valid')
        t.equal(jobWithLog3[0].log[3].type, enums.log.information, 'Log 3 type is information')
        t.equal(jobWithLog3[0].log[3].status, enums.status.waiting, 'Log 3 status is waiting')
        t.ok(jobWithLog3[0].log[3].retryCount >= 0, 'Log retryCount is valid')
        t.ok(jobWithLog3[0].log[3].processCount >= 0, 'Log processCount is valid')
        t.equal(jobWithLog3[0].log[3].message, enums.message.seeLogData, 'Log 3 message is valid')
        t.ok(is.object(jobWithLog3[0].log[3].data), 'Log 3 data is valid')
        t.equal(jobWithLog3[0].getLastLog(), jobWithLog3[0].log[3], 'Last log entry is correctly retrieved')

        // ---------- Add Object Log Tests ----------
        t.comment('job-log: Add Object Log')
        return jobLog.commitLog(job, logObject)
      }).then((updateResult4) => {
        t.ok(updateResult4, 'Log 4 added to job successfully')
        return q.getJob(job.id)
      }).then((jobWithLog4) => {
        t.equal(jobWithLog4[0].log.length, 5, 'Log 4 exists on retrieved job')
        t.ok(is.date(jobWithLog4[0].log[4].date), 'Log 4 date is a date')
        t.equal(jobWithLog4[0].log[4].queueId, q.id, 'Log 4 queueId is valid')
        t.equal(jobWithLog4[0].log[4].type, enums.log.information, 'Log 4 type is information')
        t.equal(jobWithLog4[0].log[4].status, enums.status.waiting, 'Log 4 status is added')
        t.ok(jobWithLog4[0].log[4].retryCount >= 0, 'Log retryCount is valid')
        t.ok(jobWithLog4[0].log[4].processCount >= 0, 'Log processCount is valid')
        t.equal(jobWithLog4[0].log[4].message, enums.message.seeLogData, 'Log 4 message is valid')
        t.equal(jobWithLog4[0].log[4].data.foo, 'bar', 'Log 4 data object is valid')
        t.equal(jobWithLog4[0].getLastLog(), jobWithLog4[0].log[4], 'Last log entry is correctly retrieved')

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
