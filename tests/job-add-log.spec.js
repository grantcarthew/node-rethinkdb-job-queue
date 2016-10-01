const test = require('tape')
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const jobAddLog = require('../src/job-add-log')
const tData = require('./test-options').tData
const Queue = require('../src/queue')
const tOpts = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job-add-log', (t) => {
      t.plan(47)

      const q = new Queue(tOpts.cxn(), tOpts.default())
      let job = q.createJob()
      job.detail = tData
      let testLog
      let extra = 'extra data'
      let logObject = { foo: 'bar' }

      let testEvents = false
      function logEventHandler (jobId) {
        if (testEvents) {
          t.equal(jobId, job.id, `Event: log [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.log, logEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.log, logEventHandler)
      }

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        addEventHandlers()
        return q.addJob(job)
      }).then((newJob) => {
        job = newJob[0]
        t.equal(job.status, enums.status.waiting, 'New job added successfully')
        testLog = job.createLog(tData)
        testLog.detail = tData

        // ---------- Add First Log Tests ----------
        t.comment('job-add-log: Add First Log')
        return jobAddLog(job, testLog)
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
        t.equal(jobWithLog1[0].log[1].message, tData, 'Log 1 message is valid')
        t.equal(jobWithLog1[0].log[1].detail, tData, 'Log 1 detail is valid')
        testLog.extra = extra

        // ---------- Add Second Log Tests ----------
        t.comment('job-add-log: Add Second Log')
        return jobAddLog(job, testLog)
      }).then((updateResult2) => {
        t.ok(updateResult2, 'Log 2 added to job successfully')
        return q.getJob(job.id)
      }).then((jobWithLog2) => {
        t.equal(jobWithLog2[0].log.length, 3, 'Log 2 exists on retrieved job')
        t.ok(is.date(jobWithLog2[0].log[2].date), 'Log 2 date is a date')
        t.equal(jobWithLog2[0].log[2].queueId, q.id, 'Log 2 queueId is valid')
        t.equal(jobWithLog2[0].log[2].type, enums.log.information, 'Log 2 type is information')
        t.equal(jobWithLog2[0].log[2].status, enums.status.waiting, 'Log 2 status is added')
        t.ok(jobWithLog2[0].log[2].retryCount >= 0, 'Log retryCount is valid')
        t.equal(jobWithLog2[0].log[2].message, tData, 'Log 2 message is valid')
        t.equal(jobWithLog2[0].log[2].detail, tData, 'Log 2 detail is valid')
        t.equal(jobWithLog2[0].log[2].extra, extra, 'Log 2 extra is valid')

        // ---------- Add String Log Tests ----------
        t.comment('job-add-log: Add String Log')
        return jobAddLog(job, extra)
      }).then((updateResult3) => {
        t.ok(updateResult3, 'Log 3 added to job successfully')
        return q.getJob(job.id)
      }).then((jobWithLog3) => {
        t.equal(jobWithLog3[0].log.length, 4, 'Log 3 exists on retrieved job')
        t.ok(is.date(jobWithLog3[0].log[3].date), 'Log 3 date is a date')
        t.equal(jobWithLog3[0].log[3].queueId, q.id, 'Log 3 queueId is valid')
        t.equal(jobWithLog3[0].log[3].type, enums.log.information, 'Log 3 type is information')
        t.equal(jobWithLog3[0].log[3].status, enums.status.waiting, 'Log 3 status is added')
        t.ok(jobWithLog3[0].log[3].retryCount >= 0, 'Log retryCount is valid')
        t.equal(jobWithLog3[0].log[3].message, extra, 'Log 3 message is valid')
        t.notEqual(jobWithLog3[0].log[3].detail, tData, 'Log 3 detail is valid')
        t.notEqual(jobWithLog3[0].log[3].extra, extra, 'Log 3 extra is valid')

        // ---------- Add Object Log Tests ----------
        t.comment('job-add-log: Add Object Log')
        return jobAddLog(job, logObject)
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
        t.notEqual(jobWithLog4[0].log[4].message, tData, 'Log 4 message is valid')
        t.notEqual(jobWithLog4[0].log[4].detail, tData, 'Log 4 detail is valid')
        t.notEqual(jobWithLog4[0].log[4].extra, extra, 'Log 4 extra is valid')
        t.equal(jobWithLog4[0].log[4].data.foo, 'bar', 'Log 4 data object is valid')

        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        removeEventHandlers()
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
