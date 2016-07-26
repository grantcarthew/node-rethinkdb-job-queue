const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const enums = require('../src/enums')
const testError = require('./test-error')
const queueAddJob = require('../src/queue-add-job')
const queueGetNextJob = require('../src/queue-get-next-job')
const testData = require('./test-options').testData
const Queue = require('../src/queue')
const testOptions = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-get-next-job', (t) => {
      t.plan(113)

      // ---------- Creating Priority Test Jobs ----------
      const q = new Queue(testOptions.queueDefault())
      q._concurrency = 1
      let activeCount = 0
      function activeEventHandler (jobId) {
        activeCount++
        t.ok(is.uuid(jobId), `Event: Job Active [${activeCount}] [${jobId}]`)
      }
      q.on(enums.status.active, activeEventHandler)

      const jobLowest = q.createJob(testData, {priority: 'lowest'})
      jobLowest.status = enums.status.added
      jobLowest.data = 'Lowest'
      const jobLow = q.createJob(testData, {priority: 'low'})
      jobLow.status = enums.status.added
      jobLow.data = 'Low'
      const jobNormal = q.createJob(testData, {priority: 'normal'})
      jobNormal.status = enums.status.added
      jobNormal.data = 'Normal'
      const jobMedium = q.createJob(testData, {priority: 'medium'})
      jobMedium.status = enums.status.added
      jobMedium.data = 'Medium'
      const jobHigh = q.createJob(testData, {priority: 'high'})
      jobHigh.status = enums.status.added
      jobHigh.data = 'High'
      const jobHighest = q.createJob(testData, {priority: 'highest'})
      jobHighest.status = enums.status.added
      jobHighest.data = 'Highest'
      const jobFailed1 = q.createJob(testData, {priority: 'retry'})
      jobFailed1.status = enums.status.failed
      jobFailed1.data = 'Failed'
      const jobFailed2 = q.createJob(testData, {priority: 'retry'})
      jobFailed2.status = enums.status.failed
      jobFailed2.data = 'Timeout'
      jobFailed2.dateCreated = moment().add(1, 'seconds').toDate()
      const jobActive = q.createJob(testData, {priority: 'retry'})
      jobActive.status = enums.status.active
      jobActive.data = 'Active'
      const jobCompleted = q.createJob(testData, {priority: 'retry'})
      jobCompleted.status = enums.status.completed
      jobCompleted.data = 'Completed'
      const jobCancelled = q.createJob(testData, {priority: 'retry'})
      jobCancelled.status = enums.status.cancelled
      jobCancelled.data = 'Cancelled'
      const jobTerminated = q.createJob(testData, {priority: 'retry'})
      jobTerminated.status = enums.status.terminated
      jobTerminated.data = 'Terminated'
      let allCreatedJobs = [
        jobLowest,
        jobLow,
        jobNormal,
        jobMedium,
        jobHigh,
        jobHighest,
        jobFailed1,
        jobFailed2,
        jobActive,
        jobCompleted,
        jobCancelled,
        jobTerminated
      ]
      let retryJobs

      // Uncomment below for fault finding
      // allCreatedJobs.map((j) => {
      //   console.log(`${j.id} ${j.data}`)
      // })

      // ---------- Adding Jobs for Testing ----------
      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return queueAddJob(q, allCreatedJobs, true)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 12, 'Jobs saved successfully')

        // ---------- Getting Jobs in Priority Order ----------
        t.comment('queue-get-next-job: Jobs in Priority Order')
        return queueGetNextJob(q)
      }).then((failed) => {
        t.equals(failed[0].id, jobFailed1.id, 'Failed status job1 returned first')
        t.ok(moment.isDate(failed[0].log[1].date), 'Log date is a date')
        t.equal(failed[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(failed[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(failed[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(failed[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(failed[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((timeout) => {
        t.equals(timeout[0].id, jobFailed2.id, 'Failed status job2 returned second (dateCreated + 1sec)')
        t.ok(moment.isDate(timeout[0].log[1].date), 'Log date is a date')
        t.equal(timeout[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(timeout[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(timeout[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(timeout[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(timeout[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((highest) => {
        t.equals(highest[0].id, jobHighest.id, 'Highest status job returned third')
        t.ok(moment.isDate(highest[0].log[1].date), 'Log date is a date')
        t.equal(highest[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(highest[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(highest[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(highest[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(highest[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((high) => {
        t.equals(high[0].id, jobHigh.id, 'High status job returned fourth')
        t.ok(moment.isDate(high[0].log[1].date), 'Log date is a date')
        t.equal(high[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(high[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(high[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(high[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(high[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((medium) => {
        t.equals(medium[0].id, jobMedium.id, 'Medium status job returned fifth')
        t.ok(moment.isDate(medium[0].log[1].date), 'Log date is a date')
        t.equal(medium[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(medium[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(medium[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(medium[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(medium[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((normal) => {
        t.equals(normal[0].id, jobNormal.id, 'Normal status job returned sixth')
        t.ok(moment.isDate(normal[0].log[1].date), 'Log date is a date')
        t.equal(normal[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(normal[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(normal[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(normal[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(normal[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((low) => {
        t.equals(low[0].id, jobLow.id, 'Low status job returned seventh')
        t.ok(moment.isDate(low[0].log[1].date), 'Log date is a date')
        t.equal(low[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(low[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(low[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(low[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(low[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((lowest) => {
        t.equals(lowest[0].id, jobLowest.id, 'Lowest status job returned last')
        t.ok(moment.isDate(lowest[0].log[1].date), 'Log date is a date')
        t.equal(lowest[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(lowest[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(lowest[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(lowest[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(lowest[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((noneLeft) => {
        t.equals(noneLeft.length, 0, 'Skips active, completed, and terminated jobs')
        let moreJobs = []
        for (let i = 0; i < 7; i++) {
          moreJobs.push(q.createJob(testData))
        }
        return q.addJob(moreJobs)
      }).then((moreSavedJobs) => {
        t.equal(moreSavedJobs.length, 7, 'Jobs saved successfully')
        q._concurrency = 3
        q._running = 4

        // ---------- Testing Concurrency and Running ----------
        t.comment('queue-get-next-job: Concurrency and Running')
        return queueGetNextJob(q)
      }).then((group0) => {
        t.equals(group0.length, 0, 'Returned zero jobs due to concurrency and running')
        q._running = 3
        return queueGetNextJob(q)
      }).then((group0) => {
        t.equals(group0.length, 0, 'Returned zero jobs due to concurrency and running')
        q._running = 2
        return queueGetNextJob(q)
      }).then((group1) => {
        t.equals(group1.length, 1, 'Returned one job due to concurrency and running')
        t.equals(group1[0].status, enums.status.active, 'Returned job is active status')
        t.ok(moment.isDate(group1[0].dateStarted), 'Returned job dateStarted is a date')
        q._running = 1
        return queueGetNextJob(q)
      }).then((group2) => {
        t.equals(group2.length, 2, 'Returned two jobs due to concurrency and running')
        t.equals(group2[0].status, enums.status.active, 'Returned job 1 is active status')
        t.ok(moment.isDate(group2[0].dateStarted), 'Returned job 1 dateStarted is a date')
        t.equals(group2[0].status, enums.status.active, 'Returned job 2 is active status')
        t.ok(moment.isDate(group2[1].dateStarted), 'Returned job 2 dateStarted is a date')
        q._running = 0
        return queueGetNextJob(q)
      }).then((group3) => {
        t.equals(group3.length, 3, 'Returned three jobs due to concurrency and running')
        t.equals(group3[0].status, enums.status.active, 'Returned job 1 is active status')
        t.ok(moment.isDate(group3[0].dateStarted), 'Returned job 1 dateStarted is a date')
        t.equals(group3[0].status, enums.status.active, 'Returned job 2 is active status')
        t.ok(moment.isDate(group3[1].dateStarted), 'Returned job 2 dateStarted is a date')
        t.equals(group3[0].status, enums.status.active, 'Returned job 3 is active status')
        t.ok(moment.isDate(group3[2].dateStarted), 'Returned job 3 dateStarted is a date')
        return queueGetNextJob(q)
      }).then((group4) => {
        t.equals(group4.length, 1, 'Returned final job')
        t.equals(group4[0].status, enums.status.active, 'Returned job is active status')
        t.ok(moment.isDate(group4[0].dateStarted), 'Returned job dateStarted is a date')

        // ---------- Testing dateRetry Values ----------
        t.comment('queue-get-next-job: dateRetry Values')
        retryJobs = q.createJob(testData, 2)
        retryJobs[0].dateRetry = moment().add(100, 'seconds').toDate()
        retryJobs[1].dateRetry = moment().add(-100, 'seconds').toDate()
        return q.addJob(retryJobs)
      }).then((retrySavedJobs) => {
        t.equal(retrySavedJobs.length, 2, 'Jobs saved successfully')
        return queueGetNextJob(q)
      }).then((retryGet) => {
        t.equal(retryGet.length, 1, 'Only one job available based on dateRetry')
        t.equal(retryGet[0].id, retryJobs[1].id, 'Retry job valid')

        // ---------- Testing dateRetry with retryCount ----------
        t.comment('queue-get-next-job: dateRetry with retryCount')
        retryJobs = q.createJob(testData, 4)
        retryJobs[0].retryCount = 0
        retryJobs[0].dateRetry = moment().add(-100, 'seconds').toDate()
        retryJobs[1].retryCount = 1
        retryJobs[1].dateRetry = moment().add(-200, 'seconds').toDate()
        retryJobs[2].retryCount = 2
        retryJobs[2].dateRetry = moment().add(-300, 'seconds').toDate()
        retryJobs[3].retryCount = 3
        retryJobs[3].dateRetry = moment().add(-400, 'seconds').toDate()
        return q.addJob(retryJobs)
      }).then((retrySavedJobs) => {
        t.equal(retrySavedJobs.length, 4, 'Jobs saved successfully')
        return queueGetNextJob(q)
      }).then((retryGet2) => {
        retryGet2.sort((a, b) => {
          if (moment(a.dateRetry).isSameOrBefore(b.dateRetry)) return -1
          return 1
        })
        t.equal(retryGet2.length, 3, 'Jobs retrieved successfully')
        let ids = retryGet2.map(j => j.id)
        t.ok(!ids.includes(retryJobs[0].id), 'Retrieved in dateRetry order successfully')
        t.ok(moment().isBefore(retryGet2[0].dateRetry), 'dateRetry for first job is valid')
        t.ok(moment(retryGet2[0].dateRetry).isBefore(retryGet2[1].dateRetry), 'dateRetry for second job is valid')
        t.ok(moment(retryGet2[1].dateRetry).isBefore(retryGet2[2].dateRetry), 'dateRetry for third job is valid')
        return queueGetNextJob(q)
      }).then((retryGet3) => {
        t.equal(retryGet3.length, 1, 'Last job retrieved successfully')
        t.equal(retryGet3[0].id, retryJobs[0].id, 'Last job is valid')
        t.equal(activeCount, 20, 'Active event count valid')
        q.removeListener(enums.status.active, activeEventHandler)
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
