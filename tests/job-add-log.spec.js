const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const enums = require('../src/enums')
const jobAddLog = require('../src/job-add-log')
const testData = require('./test-options').testData
const Queue = require('../src/queue')
const testOptions = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job-add-log', (t) => {
      t.plan(24)

      const q = new Queue(testOptions.queueDefault())
      let job = q.createJob(testData)
      let testLog
      let extra = 'extra data'

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
        t.equal(job.status, enums.status.added, 'New job added successfully')
        testLog = job.createLog(testData)
        testLog.data = testData

        // ---------- Add First Log Tests ----------
        t.comment('job-add-log: Add First Log')
        return jobAddLog(job, testLog)
      }).then((updateResult1) => {
        t.equal(updateResult1, 1, 'Log 1 added to job successfully')
        return q.getJob(job.id)
      }).then((jobWithLog1) => {
        t.equal(jobWithLog1[0].log.length, 2, 'Log 1 exists on retrieved job')
        t.ok(moment.isDate(jobWithLog1[0].log[1].date), 'Log 1 date is a date')
        t.equal(jobWithLog1[0].log[1].queueId, q.id, 'Log 1 queueId is valid')
        t.equal(jobWithLog1[0].log[1].type, enums.log.information, 'Log 1 type is information')
        t.equal(jobWithLog1[0].log[1].status, enums.status.added, 'Log 1 status is added')
        t.ok(jobWithLog1[0].log[1].retryCount >= 0, 'Log retryCount is valid')
        t.equal(jobWithLog1[0].log[1].message, testData, 'Log 1 message is valid')
        t.equal(jobWithLog1[0].log[1].data, testData, 'Log 1 data is valid')
        testLog.extra = extra

        // ---------- Add Second Log Tests ----------
        t.comment('job-add-log: Add Second Log')
        return jobAddLog(job, testLog)
      }).then((updateResult2) => {
        t.equal(updateResult2, 1, 'Log 2 added to job successfully')
        return q.getJob(job.id)
      }).then((jobWithLog2) => {
        t.equal(jobWithLog2[0].log.length, 3, 'Log 2 exists on retrieved job')
        t.ok(moment.isDate(jobWithLog2[0].log[2].date), 'Log 2 date is a date')
        t.equal(jobWithLog2[0].log[2].queueId, q.id, 'Log 2 queueId is valid')
        t.equal(jobWithLog2[0].log[2].type, enums.log.information, 'Log 2 type is information')
        t.equal(jobWithLog2[0].log[2].status, enums.status.added, 'Log 2 status is added')
        t.ok(jobWithLog2[0].log[2].retryCount >= 0, 'Log retryCount is valid')
        t.equal(jobWithLog2[0].log[2].message, testData, 'Log 2 message is valid')
        t.equal(jobWithLog2[0].log[2].data, testData, 'Log 2 data is valid')
        t.equal(jobWithLog2[0].log[2].extra, extra, 'Log 2 extra data is valid')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        removeEventHandlers()
        q.stop()
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
