const test = require('tape')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const dbQueueAddJob = require('../src/db-queue-addjob')
const testData = require('./test-options').testData

test('db-queue-addjob test', (t) => {
  t.plan(5)

  let job = testQueue.createJob(testData)
  let jobs = [
    testQueue.createJob(testData),
    testQueue.createJob(testData)
  ]

  dbQueueAddJob(testQueue, job).then((savedJob) => {
    t.equal(savedJob[0].id, job.id, 'Job 1 saved successfully')
    return dbQueueAddJob(testQueue, jobs)
  }).then((savedJobs) => {
    t.equal(savedJobs[0].id, jobs[0].id, 'Job 2 saved successfully')
    t.equal(savedJobs[1].id, jobs[1].id, 'Job 3 saved successfully')
  }).then(() => {
    return dbQueueAddJob(testQueue)
  }).then((nullJobResult) => {
    t.equal(nullJobResult.length, 0,
      'Job null or undefined returns an empty array')
    return dbQueueAddJob(testQueue, {}).then(() => {
      t.fail('Job invalid is not returning a rejected promise')
    }).catch((err) => {
      t.equal(err, enums.error.jobInvalid, 'Job invalid returns a rejected promise')
    })
  })
})
