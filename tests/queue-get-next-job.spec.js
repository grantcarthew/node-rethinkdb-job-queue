const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const queueAddJob = require('../src/queue-add-job')
const queueGetNextJob = require('../src/queue-get-next-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-get-next-job test', (t) => {
      t.plan(14)

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
      const jobActive = q.createJob(testData, {priority: 'retry'})
      jobActive.status = 'active'
      jobActive.data = 'Active'
      const jobCompleted = q.createJob(testData, {priority: 'retry'})
      jobCompleted.status = 'completed'
      jobCompleted.data = 'Completed'
      const jobFailed = q.createJob(testData, {priority: 'retry'})
      jobFailed.status = 'failed'
      jobFailed.data = 'Failed'
      const jobTimeout = q.createJob(testData, {priority: 'normal'})
      jobTimeout.status = 'timeout'
      jobTimeout.data = 'Timeout'
      let allCreatedJobs = [
        jobLowest,
        jobLow,
        jobNormal,
        jobMedium,
        jobHigh,
        jobHighest,
        jobRetry,
        jobActive,
        jobCompleted,
        jobTimeout,
        jobFailed
      ]
      allCreatedJobs.map((j) => {
        console.log(`${j.id} ${j.data}`)
      })

      return queueAddJob(q, allCreatedJobs, true)
      .then((savedJobs) => {
        t.equal(savedJobs.length, 11, 'Jobs saved successfully')
        return queueGetNextJob(q)
      }).then((first) => {
        t.equals(first[0].id, jobRetry.id, 'Retry status job returned first')
        return queueGetNextJob(q)
      }).then((second) => {
        t.equals(second[0].id, jobHighest.id, 'Highest status job returned second')
        return queueGetNextJob(q)
      }).then((third) => {
        t.equals(third[0].id, jobHigh.id, 'High status job returned third')
        return queueGetNextJob(q)
      }).then((fourth) => {
        t.equals(fourth[0].id, jobMedium.id, 'Medium status job returned fourth')
        return queueGetNextJob(q)
      }).then((fifth) => {
        t.equals(fifth[0].id, jobNormal.id, 'Normal status job returned fifth')
        return queueGetNextJob(q)
      }).then((sixth) => {
        t.equals(sixth[0].id, jobLow.id, 'Low status job returned sixth')
        return queueGetNextJob(q)
      }).then((last) => {
        t.equals(last[0].id, jobLowest.id, 'Lowest status job returned last')
        return queueGetNextJob(q)
      }).then((noneLeft) => {
        t.equals(noneLeft.length, 0, 'Skips active, completed, and failed jobs')
        let moreJobs = []
        for (let i = 0; i < 10; i++) {
          moreJobs.push(q.createJob(testData))
        }
        return q.addJob(moreJobs)
      }).then((moreSavedJobs) => {
        t.equal(moreSavedJobs.length, 10, 'Jobs saved successfully')
        q.concurrency = 3
        return queueGetNextJob(q)
      }).then((group1) => {
        t.equals(group1.length, 3, 'Returned three jobs due to concurrency')
        return queueGetNextJob(q)
      }).then((group2) => {
        t.equals(group2.length, 3, 'Returned three jobs due to concurrency')
        return queueGetNextJob(q)
      }).then((group3) => {
        t.equals(group3.length, 3, 'Returned three jobs due to concurrency')
        return queueGetNextJob(q)
      }).then((group4) => {
        t.equals(group4.length, 1, 'Returned final job due to concurrency')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
