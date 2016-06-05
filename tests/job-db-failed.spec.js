const test = require('tape')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const Promise = require('bluebird')
const testOptions = require('./test-options')
const jobDbFailed = require('../src/job-db-failed')
const testData = 'This is a test'

test('job-db-failed test', (t) => {
  t.plan(2)

  let job = testQueue.createJob(testData)

  testQueue.addJob(job).then((savedJob) => {
    t.equal(savedJob[0].id, job.id, 'Jobs saved successfully')
    return jobDbFailed(null, savedJob[0], testData)
  }).then((changeResult) => {
    t.equal(changeResult.replaced, 1, 'Jobs updated successfully')
    return testQueue.getJob(job.id)
  }).then((updated1Job) => {
    console.dir(updated1Job)
  })
})
