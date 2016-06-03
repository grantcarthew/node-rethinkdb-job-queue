const test = require('tape')
const testQueue = require('./test-queue')
const Promise = require('bluebird')
const testOptions = require('./test-options')
const dbJob = require('../src/db-job')

test('db-job test', (t) => {
  t.plan(2)

  let jobs = [
    testQueue.createJob(),
    testQueue.createJob()
  ]
  testQueue.addJob(jobs).then((savedJobs) => {
    t.equal(savedJobs.length, 2, 'Jobs saved successfully')
    return Promise.all([
      dbJob.completed(savedJobs[0], 'Testing'),
      dbJob.failed(null, savedJobs[1], 'Testing')
    ])
  }).then((changeResults) => {
    t.equal(changeResults.reduce((a, b) => {
      return a.replaced + b.replaced
    }), 2, 'Jobs updated successfully')
    const jobIds = jobs.map(j => j.id)
    return testQueue.getJob(jobIds)
  }).then((updatedJobs) => {
    console.dir(updatedJobs)
  })
})
