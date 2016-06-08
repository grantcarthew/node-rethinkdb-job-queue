const test = require('tape')
const Promise = require('bluebird')
const testQueue = require('./test-queue')
const moment = require('moment')
const enums = require('../src/enums')
const dbReview = require('../src/db-review')
const dbChanges = require('../src/db-changes')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-review test', (t) => {
      t.plan(32)

      let q = testQueue()
      let reviewCount = 0
      q.masterReviewPeriod = 1
      q.on(enums.queueStatus.review, (reviewed) => {
        reviewCount++
        t.pass('Database review event: ' + reviewCount)
        t.ok(Number.isInteger(reviewed), 'Review event return value is an Integer')
        if (reviewCount > 2) {
          dbReview.stop(q)
          q.masterReviewPeriod = 300
          t.pass('Review timer completed twice')
          resolve()
        }
        return true
      })

      let job1 = q.createJob(testData)
      job1.status = enums.jobStatus.active
      job1.dateStarted = moment().add(-400, 'seconds').toDate()
      job1.retryCount = 0
      job1.retryMax = 1

      let job2 = q.createJob(testData)
      job2.status = enums.jobStatus.active
      job2.dateStarted = moment().add(-400, 'seconds').toDate()
      job2.retryCount = 1
      job2.retryMax = 1

      let jobs = [
        job1,
        job2
      ]
      // Saving directly to db to bypass status checks.
      return q.ready.then(() => {
        return jobs.map(j => j.cleanCopy)
      }).then((cleanJobs) => {
        return q.r.db(q.db).table(q.name)
        .insert(cleanJobs, {returnChanges: true}).run()
      }).then((saveResult) => {
        return dbChanges.toJob(q, saveResult)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job1.id, 'Job 1 saved successfully')
        t.equal(savedJob[1].id, job2.id, 'Job 2 saved successfully')
      }).then(() => {
        return dbReview.jobTimeout(q)
      }).then((reviewResult) => {
        t.ok(reviewResult.replaced >= 2, 'Job updated by db review')
        return q.getJob(job1.id)
      }).then((reviewedJob1) => {
        t.equal(reviewedJob1[0].status, enums.jobStatus.timeout, 'Reviewed job 1 is timeout status')
        t.ok(moment.isDate(reviewedJob1[0].dateTimeout), 'Reviewed job 1 dateTimeout is a date')
        t.ok(!reviewedJob1[0].dateFailed, 'Reviewed job 1 dateFailed is null')
        t.equal(reviewedJob1[0].retryCount, 1, 'Reviewed job 1 retryCount is 1')
        t.ok(moment.isDate(reviewedJob1[0].log[0].logDate), 'Log logDate is a date')
        t.equal(reviewedJob1[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(reviewedJob1[0].log[0].logType, enums.log.warning, 'Log type is warning')
        t.equal(reviewedJob1[0].log[0].status, enums.jobStatus.timeout, 'Log status is timeout')
        t.ok(reviewedJob1[0].log[0].queueMessage, 'Log queueMessage is present')
        t.ok(reviewedJob1[0].log[0].duration >= 0, 'Log duration is >= 0')
        t.ok(!reviewedJob1[0].log[0].jobData, 'Log jobData is null')
        return q.getJob(job2.id)
      }).then((reviewedJob2) => {
        t.equal(reviewedJob2[0].status, enums.jobStatus.failed, 'Reviewed job 2 is failed status')
        t.ok(moment.isDate(reviewedJob2[0].dateTimeout), 'Reviewed job 2 dateTimeout is a date')
        t.ok(moment.isDate(reviewedJob2[0].dateFailed), 'Reviewed job 2 dateFailed is a date')
        t.equal(reviewedJob2[0].retryCount, 1, 'Reviewed job 2 retryCount is 1')
        t.ok(moment.isDate(reviewedJob2[0].log[0].logDate), 'Log logDate is a date')
        t.equal(reviewedJob2[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(reviewedJob2[0].log[0].logType, enums.log.error, 'Log type is error')
        t.equal(reviewedJob2[0].log[0].status, enums.jobStatus.failed, 'Log status is failed')
        t.ok(reviewedJob2[0].log[0].queueMessage, 'Log queueMessage is present')
        t.ok(reviewedJob2[0].log[0].duration >= 0, 'Log duration is >= 0')
        t.ok(!reviewedJob2[0].log[0].jobData, 'Log jobData is null')
        dbReview.start(q)
      }).catch(err => t.fail(err))
    })
  })
}
