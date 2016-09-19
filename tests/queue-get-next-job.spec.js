const test = require('tape')
const Promise = require('bluebird')
const datetime = require('../src/datetime')
const is = require('../src/is')
const enums = require('../src/enums')
const tError = require('./test-error')
const queueAddJob = require('../src/queue-add-job')
const queueGetNextJob = require('../src/queue-get-next-job')
const Queue = require('../src/queue')
const tOpts = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-get-next-job', (t) => {
      t.plan(105)

      // ---------- Creating Priority Test Jobs ----------
      const q = new Queue(tOpts.cxn(), tOpts.default())
      q._concurrency = 1
      let activeCount = 0
      function activeEventHandler (jobId) {
        activeCount++
        t.ok(is.uuid(jobId), `Event: Job Active [${activeCount}] [${jobId}]`)
      }
      q.on(enums.status.active, activeEventHandler)

      const jobLowest = q.createJob({priority: 'lowest'})
      jobLowest.status = enums.status.waiting
      jobLowest.data = 'Lowest'
      const jobLow = q.createJob({priority: 'low'})
      jobLow.status = enums.status.waiting
      jobLow.data = 'Low'
      const jobNormal = q.createJob({priority: 'normal'})
      jobNormal.status = enums.status.waiting
      jobNormal.data = 'Normal'
      const jobMedium = q.createJob({priority: 'medium'})
      jobMedium.status = enums.status.waiting
      jobMedium.data = 'Medium'
      const jobHigh = q.createJob({priority: 'high'})
      jobHigh.status = enums.status.waiting
      jobHigh.data = 'High'
      const jobHighest = q.createJob({priority: 'highest'})
      jobHighest.status = enums.status.waiting
      jobHighest.data = 'Highest'
      const jobFailed = q.createJob({priority: 'highest'})
      jobFailed.status = enums.status.failed
      jobFailed.data = 'Failed'
      jobFailed.dateCreated = datetime.add.sec(new Date(), -1)
      const jobActive = q.createJob({priority: 'normal'})
      jobActive.status = enums.status.active
      jobActive.data = 'Active'
      const jobCompleted = q.createJob({priority: 'normal'})
      jobCompleted.status = enums.status.completed
      jobCompleted.data = 'Completed'
      const jobCancelled = q.createJob({priority: 'normal'})
      jobCancelled.status = enums.status.cancelled
      jobCancelled.data = 'Cancelled'
      const jobTerminated = q.createJob({priority: 'normal'})
      jobTerminated.status = enums.status.terminated
      jobTerminated.data = 'Terminated'
      let allCreatedJobs = [
        jobLowest,
        jobLow,
        jobNormal,
        jobMedium,
        jobHigh,
        jobHighest,
        jobFailed,
        jobActive,
        jobCompleted,
        jobCancelled,
        jobTerminated
      ]
      let retryJobs

      // Uncomment below for debugging
      // allCreatedJobs.map((j) => {
      //   console.log(`${j.id} ${j.data}`)
      // })

      // ---------- Adding Jobs for Testing ----------
      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return queueAddJob(q, allCreatedJobs, true)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 11, 'Jobs saved successfully')

        // ---------- Getting Jobs in Priority Order ----------
        t.comment('queue-get-next-job: Jobs in Priority Order')
        return queueGetNextJob(q)
      }).then((failed) => {
        t.equals(failed[0].id, jobFailed.id, 'Failed status job1 returned first')
        t.ok(is.date(failed[0].log[1].date), 'Log date is a date')
        t.equal(failed[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(failed[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(failed[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(failed[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(failed[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((highest) => {
        t.equals(highest[0].id, jobHighest.id, 'Highest status job returned third')
        t.ok(is.date(highest[0].log[1].date), 'Log date is a date')
        t.equal(highest[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(highest[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(highest[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(highest[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(highest[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((high) => {
        t.equals(high[0].id, jobHigh.id, 'High status job returned fourth')
        t.ok(is.date(high[0].log[1].date), 'Log date is a date')
        t.equal(high[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(high[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(high[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(high[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(high[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((medium) => {
        t.equals(medium[0].id, jobMedium.id, 'Medium status job returned fifth')
        t.ok(is.date(medium[0].log[1].date), 'Log date is a date')
        t.equal(medium[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(medium[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(medium[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(medium[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(medium[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((normal) => {
        t.equals(normal[0].id, jobNormal.id, 'Normal status job returned sixth')
        t.ok(is.date(normal[0].log[1].date), 'Log date is a date')
        t.equal(normal[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(normal[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(normal[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(normal[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(normal[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((low) => {
        t.equals(low[0].id, jobLow.id, 'Low status job returned seventh')
        t.ok(is.date(low[0].log[1].date), 'Log date is a date')
        t.equal(low[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(low[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(low[0].log[1].status, enums.status.active, 'Log status is active')
        t.equal(low[0].log[1].retryCount, 0, 'Log retryCount is valid')
        t.equal(low[0].log[1].message, enums.message.active, 'Log message is valid')
        return queueGetNextJob(q)
      }).then((lowest) => {
        t.equals(lowest[0].id, jobLowest.id, 'Lowest status job returned last')
        t.ok(is.date(lowest[0].log[1].date), 'Log date is a date')
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
          moreJobs.push(q.createJob())
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
        t.ok(is.date(group1[0].dateStarted), 'Returned job dateStarted is a date')
        q._running = 1
        return queueGetNextJob(q)
      }).then((group2) => {
        t.equals(group2.length, 2, 'Returned two jobs due to concurrency and running')
        t.equals(group2[0].status, enums.status.active, 'Returned job 1 is active status')
        t.ok(is.date(group2[0].dateStarted), 'Returned job 1 dateStarted is a date')
        t.equals(group2[0].status, enums.status.active, 'Returned job 2 is active status')
        t.ok(is.date(group2[1].dateStarted), 'Returned job 2 dateStarted is a date')
        q._running = 0
        return queueGetNextJob(q)
      }).then((group3) => {
        t.equals(group3.length, 3, 'Returned three jobs due to concurrency and running')
        t.equals(group3[0].status, enums.status.active, 'Returned job 1 is active status')
        t.ok(is.date(group3[0].dateStarted), 'Returned job 1 dateStarted is a date')
        t.equals(group3[0].status, enums.status.active, 'Returned job 2 is active status')
        t.ok(is.date(group3[1].dateStarted), 'Returned job 2 dateStarted is a date')
        t.equals(group3[0].status, enums.status.active, 'Returned job 3 is active status')
        t.ok(is.date(group3[2].dateStarted), 'Returned job 3 dateStarted is a date')
        return queueGetNextJob(q)
      }).then((group4) => {
        t.equals(group4.length, 1, 'Returned final job')
        t.equals(group4[0].status, enums.status.active, 'Returned job is active status')
        t.ok(is.date(group4[0].dateStarted), 'Returned job dateStarted is a date')

        // ---------- Testing dateEnable Values ----------
        t.comment('queue-get-next-job: dateEnable Values')
        retryJobs = q.createJob(2).map(j => j)
        retryJobs[0].dateEnable = datetime.add.sec(new Date(), 100)
        retryJobs[1].dateEnable = datetime.add.sec(new Date(), -100)
        return q.addJob(retryJobs)
      }).then((retrySavedJobs) => {
        t.equal(retrySavedJobs.length, 2, 'Jobs saved successfully')
        return queueGetNextJob(q)
      }).then((retryGet) => {
        t.equal(retryGet.length, 1, 'Only one job available based on dateEnable')
        t.equal(retryGet[0].id, retryJobs[1].id, 'Retry job valid')

        // ---------- Testing dateEnable with retryCount ----------
        t.comment('queue-get-next-job: dateEnable with retryCount')
        retryJobs = q.createJob(4).map(j => j)
        retryJobs[0].retryCount = 0
        retryJobs[0].dateEnable = datetime.add.sec(new Date(), -100)
        retryJobs[1].retryCount = 1
        retryJobs[1].dateEnable = datetime.add.sec(new Date(), -200)
        retryJobs[2].retryCount = 2
        retryJobs[2].dateEnable = datetime.add.sec(new Date(), -300)
        retryJobs[3].retryCount = 3
        retryJobs[3].dateEnable = datetime.add.sec(new Date(), -400)
        return q.addJob(retryJobs)
      }).then((retrySavedJobs) => {
        t.equal(retrySavedJobs.length, 4, 'Jobs saved successfully')
        return queueGetNextJob(q)
      }).then((retryGet2) => {
        retryGet2.sort((a, b) => {
          if (is.dateBefore(a.dateEnable, b.dateEnable) ||
              a.dateEnable === b.dateEnable) { return -1 }
          return 1
        })
        t.equal(retryGet2.length, 3, 'Jobs retrieved successfully')
        let ids = retryGet2.map(j => j.id)
        t.ok(!ids.includes(retryJobs[0].id), 'Retrieved in dateEnable order successfully')
        t.ok(is.dateBefore(new Date(), retryGet2[0].dateEnable), 'dateEnable for first job is valid')
        t.ok(is.dateBefore(retryGet2[0].dateEnable, retryGet2[1].dateEnable), 'dateEnable for second job is valid')
        t.ok(is.dateBefore(retryGet2[1].dateEnable, retryGet2[2].dateEnable), 'dateEnable for third job is valid')
        return queueGetNextJob(q)
      }).then((retryGet3) => {
        t.equal(retryGet3.length, 1, 'Last job retrieved successfully')
        t.equal(retryGet3[0].id, retryJobs[0].id, 'Last job is valid')
        t.equal(activeCount, 19, 'Active event count valid')
        q.removeListener(enums.status.active, activeEventHandler)
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
