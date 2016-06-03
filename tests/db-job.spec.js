const test = require('tape')
const testQueue = require('./test-queue')
const Promise = require('bluebird')
const testOptions = require('./test-options')
const dbJob = require('../src/db-job')
const queueDefaultOptions = testOptions.queueDefaultOptions
const customJobDefaultOptions = testOptions.jobOptionsHigh


test('db-job test', (t) => {
  t.plan(6)

  let job = testQueue.createJob()
  testQueue.addJob(job).then((savedJob) => {
    console.dir(savedJob)
    //return dbJob.completed(job, 'Testing')
  }).then((completed) => {

  })
})
