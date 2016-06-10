const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const moment = require('moment')
const enums = require('../src/enums')
const testQueue = require('./test-queue')
const Job = require('../src/job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job test', (t) => {
      t.plan(25)

      const uuid = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i
      const q = testQueue()
      const newJob = new Job(q, testData)

      t.ok(newJob instanceof Job, 'New job is a Job object')
      t.deepEqual(newJob.q, q, 'New job has a reference to the queue')
      t.ok(uuid.test(newJob.id), 'New job has valid id')
      t.ok(newJob.data === testData, 'New job data is valid')
      t.ok(newJob.priority === 'normal', 'New job priority is normal')
      t.ok(newJob.status === 'created', 'New job status is created')
      t.ok(newJob.timeout === 300, 'New job timeout is 300')
      t.ok(newJob.retryMax === 3, 'New job retryMax is 3')
      t.ok(newJob.retryDelay === 600, 'New job retryDelay is 600')
      t.ok(newJob.progress === 0, 'New job progress is 0')
      t.ok(newJob.retryCount === 0, 'New job retryCount is 0')
      t.equal(newJob.log.length, 0, 'New job log is an empty array')
      t.ok(moment.isDate(newJob.dateCreated), 'New job dateCreated is a date')
      const cleanJob = newJob.cleanCopy
      t.ok(!cleanJob.q, 'Clean job does not have a reference to the queue')
      t.equal(cleanJob.id, newJob.id, 'Clean job has valid id')
      t.equal(cleanJob.data, newJob.data, 'Clean job data is valid')
      t.equal(cleanJob.priority, enums.priority[newJob.priority], 'Clean job priority is valid')
      t.equal(cleanJob.status, newJob.status, 'Clean job status is valid')
      t.equal(cleanJob.timeout, newJob.timeout, 'Clean job timeoue is valid')
      t.equal(cleanJob.retryMax, newJob.retryMax, 'Clean job retryMax is valid')
      t.equal(cleanJob.retryDelay, newJob.retryDelay, 'Clean job retryDelay is valid')
      t.equal(cleanJob.progress, newJob.progress, 'Clean job progress is valid')
      t.equal(cleanJob.retryCount, newJob.retryCount, 'Clean job retryCount is valid')
      t.equal(cleanJob.log, newJob.log, 'Clean job log is valid')
      t.equal(cleanJob.dateCreated, newJob.dateCreated, 'Clean job dateCreated is valid')



      // return YYYYYY().then((ZZZZZZZ) => {
      //   t.deepEqual(, , 'Blah successfully')
      // }).catch((err) => {
      //   t.deepEqual(, , 'Blah failing')
        resolve()
      // }).catch(err => testError(err, module, t))
    })
  })
}
