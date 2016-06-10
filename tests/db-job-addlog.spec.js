const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const dbJobAddLog = require('../src/db-job-addlog')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-job-addlog test', (t) => {
      t.plan(18)

      const q = testQueue()
      let job = q.createJob(testData)
      let testLog
      let extra = 'extra data'
      return q.addJob(job).then((newJob) => {
        job = newJob[0]
        t.equal(job.status, enums.jobStatus.waiting, 'New job added successfully')
        testLog = job.createLog(testData)
        testLog.data = testData
        return dbJobAddLog(job, testLog)
      }).then((updateResult1) => {
        t.equal(updateResult1, 1, 'Log 1 added to job successfully')
        return q.getJob(job.id)
      }).then((jobWithLog1) => {
        t.equal(jobWithLog1[0].log.length, 1, 'Log 1 exists on retrieved job')
        t.ok(moment.isDate(jobWithLog1[0].log[0].date), 'Log 1 date is a date')
        t.equal(jobWithLog1[0].log[0].queueId, q.id, 'Log 1 queueId is valid')
        t.equal(jobWithLog1[0].log[0].type, enums.log.information, 'Log 1 type is information')
        t.equal(jobWithLog1[0].log[0].status, enums.jobStatus.waiting, 'Log 1 status is waiting')
        t.equal(jobWithLog1[0].log[0].message, testData, 'Log 1 message is valid')
        t.equal(jobWithLog1[0].log[0].data, testData, 'Log 1 data is valid')
        testLog.extra = extra
        return dbJobAddLog(job, testLog)
      }).then((updateResult2) => {
        t.equal(updateResult2, 1, 'Log 2 added to job successfully')
        return q.getJob(job.id)
      }).then((jobWithLog2) => {
        t.equal(jobWithLog2[0].log.length, 2, 'Log 2 exists on retrieved job')
        t.ok(moment.isDate(jobWithLog2[0].log[1].date), 'Log 2 date is a date')
        t.equal(jobWithLog2[0].log[1].queueId, q.id, 'Log 2 queueId is valid')
        t.equal(jobWithLog2[0].log[1].type, enums.log.information, 'Log 2 type is information')
        t.equal(jobWithLog2[0].log[1].status, enums.jobStatus.waiting, 'Log 2 status is waiting')
        t.equal(jobWithLog2[0].log[1].message, testData, 'Log 2 message is valid')
        t.equal(jobWithLog2[0].log[1].data, testData, 'Log 2 data is valid')
        t.equal(jobWithLog2[0].log[1].extra, extra, 'Log 2 extra data is valid')
      }).then(() => {
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
