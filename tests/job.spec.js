const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const moment = require('moment')
const enums = require('../src/enums')
const testQueue = require('./test-queue')
const Job = require('../src/job')
const testData = require('./test-options').testData
const isUuid = require('isuuid')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job test', (t) => {
      t.plan(53)

      const q = testQueue()
      try {
        const nullJobArg = new Job(q, null, null)
        t.pass('Creating a job with null options dose not cause an exception')
      } catch (e) {
        t.fail('Creating a job with null options creates an exception')
      }

      const newJob = new Job(q, testData)
      let newJobFromData
      let savedJob

      t.ok(newJob instanceof Job, 'New job is a Job object')
      t.deepEqual(newJob.q, q, 'New job has a reference to the queue')
      t.ok(isUuid(newJob.id), 'New job has valid id')
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

      let log = newJob.createLog(testData)
      log.data = testData
      t.equal(typeof log, 'object', 'Job createLog returns a log object')
      t.ok(moment.isDate(log.date), 'Log date is a date')
      t.equal(log.queueId, q.id, 'Log queueId is valid')
      t.equal(log.type, enums.log.information, 'Log type is information')
      t.equal(log.status, enums.jobStatus.created, 'Log status is created')
      t.equal(log.message, testData, 'Log message is valid')
      t.equal(log.data, testData, 'Log data is valid')

      return q.addJob(newJob).then((addedJobs) => {
        savedJob = addedJobs[0]
        t.equal(savedJob.id, newJob.id, 'Job saved successfully')
        let jobCopy = Object.assign({}, savedJob)
        jobCopy.priority = 40
        return new Job(q, null, jobCopy)
      }).then((newJobFromData) => {
        t.equal(newJobFromData.id, savedJob.id, 'New job from data created successfully')
        t.deepEqual(newJobFromData.q, savedJob.q, 'New job from data queue valid')
        t.equal(newJobFromData.data, savedJob.data, 'New job from data job data is valid')
        t.equal(newJobFromData.priority, savedJob.priority, 'New job from data priority is valid')
        t.equal(newJobFromData.status, savedJob.status, 'New job from data status is valid')
        t.equal(newJobFromData.timeout, savedJob.timeout, 'New job from data timeout is valid')
        t.equal(newJobFromData.retryMax, savedJob.retryMax, 'New job from data retryMax is valid')
        t.equal(newJobFromData.retryDelay, savedJob.retryDelay, 'New job from data retryDelay is valid')
        t.equal(newJobFromData.progress, savedJob.progress, 'New job from data progress is valid')
        t.equal(newJobFromData.retryCount, savedJob.retryCount, 'New job from data retryCount is valid')

        return savedJob.addLog(log)
      }).then((logAddedResult) => {
        t.equal(logAddedResult, 1, 'Job log added successfully')
        return q.getJob(savedJob.id)
      }).then((jobsFromDb) => {
        t.equal(jobsFromDb[0].id, savedJob.id, 'Job retrieved successfully')
        t.equal(jobsFromDb[0].log.length, 1, 'Job log exists')
        t.ok(moment.isDate(jobsFromDb[0].log[0].date), 'Log date is a date')
        t.equal(jobsFromDb[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(jobsFromDb[0].log[0].type, enums.log.information, 'Log type is information')
        t.equal(jobsFromDb[0].log[0].status, enums.jobStatus.created, 'Log status is created')
        t.equal(jobsFromDb[0].log[0].message, testData, 'Log message is valid')
        t.equal(jobsFromDb[0].log[0].data, testData, 'Log data is valid')
      }).then(() => {
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
