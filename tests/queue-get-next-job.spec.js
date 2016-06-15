const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const queueAddJob = require('../src/queue-add-job')
const queueGetNextJob = require('../src/queue-get-next-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-get-next-job test', (t) => {
      t.plan(31)

      const q = testQueue()
      q.concurrency = 1
      const jobLowest = q.createJob(testData, {priority: 'lowest'})
      jobLowest.status = 'waiting'
      jobLowest.data = 'Lowest'
      const jobLow = q.createJob(testData, {priority: 'low'})
      jobLow.status = 'waiting'
      jobLow.data = 'Low'
      const jobNormal = q.createJob(testData, {priority: 'normal'})
      jobNormal.status = 'waiting'
      jobNormal.data = 'Normal'
      const jobMedium = q.createJob(testData, {priority: 'medium'})
      jobMedium.status = 'waiting'
      jobMedium.data = 'Medium'
      const jobHigh = q.createJob(testData, {priority: 'high'})
      jobHigh.status = 'waiting'
      jobHigh.data = 'High'
      const jobHighest = q.createJob(testData, {priority: 'highest'})
      jobHighest.status = 'waiting'
      jobHighest.data = 'Highest'
      const jobRetry = q.createJob(testData, {priority: 'retry'})
      jobRetry.status = 'retry'
      jobRetry.data = 'Retry'
      const jobTimeout = q.createJob(testData, {priority: 'retry'})
      jobTimeout.status = 'timeout'
      jobTimeout.data = 'Timeout'
      jobTimeout.dateCreated = moment().add(1, 'seconds').toDate()
      const jobActive = q.createJob(testData, {priority: 'retry'})
      jobActive.status = 'active'
      jobActive.data = 'Active'
      const jobCompleted = q.createJob(testData, {priority: 'retry'})
      jobCompleted.status = 'completed'
      jobCompleted.data = 'Completed'
      const jobFailed = q.createJob(testData, {priority: 'retry'})
      jobFailed.status = 'failed'
      jobFailed.data = 'Failed'
      let allCreatedJobs = [
        jobLowest,
        jobLow,
        jobNormal,
        jobMedium,
        jobHigh,
        jobHighest,
        jobRetry,
        jobTimeout,
        jobActive,
        jobCompleted,
        jobFailed
      ]

      // Uncomment below for fault finding
      // allCreatedJobs.map((j) => {
      //   console.log(`${j.id} ${j.data}`)
      // })

      return q.reset().then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset successfully')
        return queueAddJob(q, allCreatedJobs, true)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 11, 'Jobs saved successfully')
        return queueGetNextJob(q)
      }).then((retry) => {
        t.equals(retry[0].id, jobRetry.id, 'Retry status job returned first')
        return queueGetNextJob(q)
      }).then((timeout) => {
        t.equals(timeout[0].id, jobTimeout.id, 'Timeout status job returned second (dateCreated + 1sec)')
        return queueGetNextJob(q)
      }).then((highest) => {
        t.equals(highest[0].id, jobHighest.id, 'Highest status job returned third')
        return queueGetNextJob(q)
      }).then((high) => {
        t.equals(high[0].id, jobHigh.id, 'High status job returned fourth')
        return queueGetNextJob(q)
      }).then((medium) => {
        t.equals(medium[0].id, jobMedium.id, 'Medium status job returned fifth')
        return queueGetNextJob(q)
      }).then((normal) => {
        t.equals(normal[0].id, jobNormal.id, 'Normal status job returned sixth')
        return queueGetNextJob(q)
      }).then((low) => {
        t.equals(low[0].id, jobLow.id, 'Low status job returned seventh')
        return queueGetNextJob(q)
      }).then((lowest) => {
        t.equals(lowest[0].id, jobLowest.id, 'Lowest status job returned last')
        return queueGetNextJob(q)
      }).then((noneLeft) => {
        t.equals(noneLeft.length, 0, 'Skips active, completed, and failed jobs')
        let moreJobs = []
        for (let i = 0; i < 7; i++) {
          moreJobs.push(q.createJob(testData))
        }
        return q.addJob(moreJobs)
      }).then((moreSavedJobs) => {
        t.equal(moreSavedJobs.length, 7, 'Jobs saved successfully')
        q.concurrency = 3
        q.running = 3
        return queueGetNextJob(q)
      }).then((group0) => {
        t.equals(group0.length, 0, 'Returned zero jobs due to concurrency and running')
        q.running = 2
        return queueGetNextJob(q)
      }).then((group1) => {
        t.equals(group1.length, 1, 'Returned one job due to concurrency and running')
        t.equals(group1[0].status, enums.jobStatus.active, 'Returned job is active status')
        t.ok(moment.isDate(group1[0].dateStarted), 'Returned job dateStarted is a date')
        q.running = 1
        return queueGetNextJob(q)
      }).then((group2) => {
        t.equals(group2.length, 2, 'Returned two jobs due to concurrency and running')
        t.equals(group2[0].status, enums.jobStatus.active, 'Returned job 1 is active status')
        t.ok(moment.isDate(group2[0].dateStarted), 'Returned job 1 dateStarted is a date')
        t.equals(group2[0].status, enums.jobStatus.active, 'Returned job 2 is active status')
        t.ok(moment.isDate(group2[1].dateStarted), 'Returned job 2 dateStarted is a date')
        q.running = 0
        return queueGetNextJob(q)
      }).then((group3) => {
        t.equals(group3.length, 3, 'Returned three jobs due to concurrency and running')
        t.equals(group3[0].status, enums.jobStatus.active, 'Returned job 1 is active status')
        t.ok(moment.isDate(group3[0].dateStarted), 'Returned job 1 dateStarted is a date')
        t.equals(group3[0].status, enums.jobStatus.active, 'Returned job 2 is active status')
        t.ok(moment.isDate(group3[1].dateStarted), 'Returned job 2 dateStarted is a date')
        t.equals(group3[0].status, enums.jobStatus.active, 'Returned job 3 is active status')
        t.ok(moment.isDate(group3[2].dateStarted), 'Returned job 3 dateStarted is a date')
        return queueGetNextJob(q)
      }).then((group4) => {
        t.equals(group4.length, 1, 'Returned final job')
        t.equals(group4[0].status, enums.jobStatus.active, 'Returned job is active status')
        t.ok(moment.isDate(group4[0].dateStarted), 'Returned job dateStarted is a date')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
