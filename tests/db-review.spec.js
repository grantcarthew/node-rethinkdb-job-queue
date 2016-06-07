const test = require('tape')
const testQueue = require('./test-queue')
const moment = require('moment')
const enums = require('../src/enums')
const dbReview = require('../src/db-review')
const testData = require('./test-options').testData

test('db-review test', (t) => {
  t.plan(26)

  let job1 = testQueue.createJob(testData)
  job1.status = enums.jobStatus.active
  job1.dateStarted = moment().add(-400, 'seconds').toDate()
  job1.retryCount = 0
  job1.retryMax = 1

  let job2 = testQueue.createJob(testData)
  job2.status = enums.jobStatus.active
  job2.dateStarted = moment().add(-400, 'seconds').toDate()
  job2.retryCount = 1
  job2.retryMax = 1

  let jobs = [
    job1,
    job2
  ]

  testQueue.addJob(jobs).then((savedJob) => {
    t.equal(savedJob[0].id, job1.id, 'Job 1 saved successfully')
    t.equal(savedJob[1].id, job2.id, 'Job 2 saved successfully')
  }).then(() => {
    return dbReview.jobTimeout(testQueue)
  }).then((reviewResult) => {
    t.ok(reviewResult.replaced >= 2, 'Job updated by db review')
    return testQueue.getJob(job1.id)
  }).then((reviewedJob1) => {
    console.dir(reviewedJob1)
    t.equal(reviewedJob1[0].status, enums.jobStatus.timeout, 'Reviewed job 1 is timeout status')
    t.ok(moment.isDate(reviewedJob1[0].dateTimeout), 'Reviewed job 1 dateTimeout is a date')
    t.ok(!reviewedJob1[0].dateFailed, 'Reviewed job 1 dateFailed is null')
    t.equal(reviewedJob1[0].retryCount, 1, 'Reviewed job 1 retryCount is 1')

    t.ok(moment.isDate(reviewedJob1[0].log[0].logDate), 'Log logDate is a date')
    t.equal(reviewedJob1[0].log[0].queueId, testQueue.id, 'Log queueId is valid')
    t.equal(reviewedJob1[0].log[0].logType, enums.log.warning, 'Log type is warning')
    t.equal(reviewedJob1[0].log[0].status, enums.jobStatus.timeout, 'Log status is timeout')
    t.ok(reviewedJob1[0].log[0].queueMessage, 'Log queueMessage is present')
    t.ok(reviewedJob1[0].log[0].duration >= 0, 'Log duration is >= 0')
    t.ok(!reviewedJob1[0].log[0].jobData, 'Log jobData is null')




    return testQueue.getJob(job2.id)
  }).then((reviewedJob2) => {
    t.equal(reviewedJob2[0].status, enums.jobStatus.failed, 'Reviewed job 2 is failed status')
    t.ok(moment.isDate(reviewedJob2[0].dateTimeout), 'Reviewed job 2 dateTimeout is a date')
    t.ok(moment.isDate(reviewedJob2[0].dateFailed), 'Reviewed job 2 dateFailed is a date')
    t.equal(reviewedJob2[0].retryCount, 1, 'Reviewed job 2 retryCount is 1')

    t.ok(moment.isDate(reviewedJob2[0].log[0].logDate), 'Log logDate is a date')
    t.equal(reviewedJob2[0].log[0].queueId, testQueue.id, 'Log queueId is valid')
    t.equal(reviewedJob2[0].log[0].logType, enums.log.error, 'Log type is error')
    t.equal(reviewedJob2[0].log[0].status, enums.jobStatus.error, 'Log status is error')
    t.ok(reviewedJob2[0].log[0].queueMessage, 'Log queueMessage is present')
    t.ok(reviewedJob2[0].log[0].duration >= 0, 'Log duration is >= 0')
    t.ok(!reviewedJob2[0].log[0].jobData, 'Log jobData is null')


  }).then(() => {

  })
})
