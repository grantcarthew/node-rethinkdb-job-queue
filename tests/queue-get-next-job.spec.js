const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const queueGetNextJob = require('../src/queue-get-next-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-get-next-job test', (t) => {
      t.plan(8)

      const q = testQueue()
      q.concurrency = 1
      const jobLowest = q.createJob(testData, {priority: 'lowest'})
      const jobLow = q.createJob(testData, {priority: 'low'})
      const jobNormal = q.createJob(testData, {priority: 'normal'})
      const jobMedium = q.createJob(testData, {priority: 'medium'})
      const jobHigh = q.createJob(testData, {priority: 'high'})
      const jobHighest = q.createJob(testData, {priority: 'highest'})
      const jobRetry = q.createJob(testData, {priority: 'retry'})
      let allCreatedJobs = [
        jobLowest,
        jobLow,
        jobNormal,
        jobMedium,
        jobHigh,
        jobHighest,
        jobRetry
      ]
      let allSavedJobs

      return q.addJob(allCreatedJobs)
      .then((savedJobs) => {
        allSavedJobs = savedJobs
        t.equal(savedJobs.length, 7, 'Jobs saved successfully')
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
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
