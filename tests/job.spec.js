const test = require('tape')
const Promise = require('bluebird')
const datetime = require('../src/datetime')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const Job = require('../src/job')
const tData = require('./test-options').tData
const Queue = require('../src/queue')
const tOpts = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job', (t) => {
      t.plan(76)

      const q = new Queue(tOpts.cxn(), tOpts.default())

      const newJob = new Job(q)
      newJob.data = tData
      let savedJob
      let newTimeout = 1234

      // ---------- Event Handler Setup ----------
      let testEvents = false
      function addedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: added [${jobId}]`)
        }
      }
      function logEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: log [${jobId}]`)
        }
      }
      function progressEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: progress [${jobId}]`)
        }
      }
      function updatedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: updated [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.added, addedEventHandler)
        q.on(enums.status.log, logEventHandler)
        q.on(enums.status.progress, progressEventHandler)
        q.on(enums.status.updated, updatedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.added, addedEventHandler)
        q.removeListener(enums.status.log, logEventHandler)
        q.removeListener(enums.status.progress, progressEventHandler)
        q.removeListener(enums.status.updated, updatedEventHandler)
      }
      addEventHandlers()

      // ---------- New Job Tests ----------
      t.comment('job: New Job')
      t.ok(newJob instanceof Job, 'New job is a Job object')
      t.deepEqual(newJob.q, q, 'New job has a reference to the queue')
      t.ok(is.uuid(newJob.id), 'New job has valid id')
      t.equal(newJob.data, tData, 'New job data is valid')
      t.equal(newJob.priority, 'normal', 'New job priority is normal')
      t.equal(newJob.status, 'created', 'New job status is created')
      t.equal(newJob.timeout, enums.options.timeout, 'New job timeout is valid')
      t.equal(newJob.retryMax, enums.options.retryMax, 'New job retryMax is valid')
      t.equal(newJob.retryDelay, enums.options.retryDelay, 'New job retryDelay is valid')
      t.equal(newJob.progress, 0, 'New job progress is 0')
      t.equal(newJob.queueId, q.id, 'New job queueId is valid')
      t.equal(newJob.retryCount, 0, 'New job retryCount is 0')
      t.equal(newJob.log.length, 0, 'New job log is an empty array')
      t.ok(is.date(newJob.dateCreated), 'New job dateCreated is a date')
      t.ok(is.date(newJob.dateEnable), 'New job dateEnable is a date')

      // ---------- Clean Job Tests ----------
      t.comment('job: Clean Job')
      let cleanJob = newJob.getCleanCopy()
      t.equal(Object.keys(cleanJob).length, 13, 'Clean job has valid number of properties')
      t.equal(cleanJob.id, newJob.id, 'Clean job has valid id')
      t.equal(cleanJob.data, newJob.data, 'Clean job data is valid')
      t.equal(cleanJob.priority, enums.priority[newJob.priority], 'Clean job priority is valid')
      t.equal(cleanJob.timeout, newJob.timeout, 'Clean job timeoue is valid')
      t.equal(cleanJob.retryDelay, newJob.retryDelay, 'Clean job retryDelay is valid')
      t.equal(cleanJob.retryMax, newJob.retryMax, 'Clean job retryMax is valid')
      t.equal(cleanJob.retryCount, newJob.retryCount, 'Clean job retryCount is valid')
      t.equal(cleanJob.status, newJob.status, 'Clean job status is valid')
      t.equal(cleanJob.log, newJob.log, 'Clean job log is valid')
      t.equal(cleanJob.dateCreated, newJob.dateCreated, 'Clean job dateCreated is valid')
      t.equal(cleanJob.dateEnable, newJob.dateEnable, 'Clean job dateEnable is valid')
      t.equal(cleanJob.progress, newJob.progress, 'Clean job progress is valid')
      t.equal(cleanJob.queueId, newJob.queueId, 'Clean job progress is valid')

      cleanJob = newJob.getCleanCopy(true)
      t.equal(cleanJob.priority, 'normal', 'Clean job priorityAsString priority is normal')

      // ---------- Create Log Tests ----------
      t.comment('job: Create Log')
      let log = newJob.createLog(tData)
      log.data = tData
      t.equal(typeof log, 'object', 'Job createLog returns a log object')
      t.ok(is.date(log.date), 'Log date is a date')
      t.equal(log.queueId, q.id, 'Log queueId is valid')
      t.equal(log.type, enums.log.information, 'Log type is information')
      t.equal(log.status, enums.status.created, 'Log status is created')
      t.ok(log.retryCount >= 0, 'Log retryCount is valid')
      t.equal(log.message, tData, 'Log message is valid')
      t.equal(log.data, tData, 'Log data is valid')

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(newJob)
      }).then((addedJobs) => {
        savedJob = addedJobs[0]
        t.equal(savedJob.id, newJob.id, 'Job saved successfully')
        let jobCopy = Object.assign({}, savedJob)
        jobCopy.priority = 40

        // ---------- New Job From Data ----------
        t.comment('job: New Job from Data')
        return new Job(q, jobCopy)
      }).then((newJobFromData) => {
        t.equal(newJobFromData.id, savedJob.id, 'New job from data created successfully')
        t.deepEqual(newJobFromData.q, savedJob.q, 'New job from data queue valid')
        t.equal(newJobFromData.data, savedJob.data, 'New job from data job data is valid')
        t.equal(newJobFromData.priority, savedJob.priority, 'New job from data priority is valid')
        t.equal(newJobFromData.timeout, savedJob.timeout, 'New job from data timeout is valid')
        t.equal(newJobFromData.retryDelay, savedJob.retryDelay, 'New job from data retryDelay is valid')
        t.equal(newJobFromData.retryMax, savedJob.retryMax, 'New job from data retryMax is valid')
        t.equal(newJobFromData.retryCount, savedJob.retryCount, 'New job from data retryCount is valid')
        t.equal(newJobFromData.status, savedJob.status, 'New job from data status is valid')
        t.equal(newJobFromData.log, savedJob.log, 'Clean job log is valid')
        t.equal(newJobFromData.dateCreated, savedJob.dateCreated, 'Clean job dateCreated is valid')
        t.equal(newJobFromData.dateEnable, savedJob.dateEnable, 'Clean job dateEnable is valid')
        t.equal(newJobFromData.progress, savedJob.progress, 'New job from data progress is valid')
        t.equal(newJobFromData.queueId, q.id, 'New job from data queueId is valid')

        // ---------- Add Job Log ----------
        t.comment('job: Add Job Log')
        return savedJob.addLog(log)
      }).then((logAddedResult) => {
        t.equal(logAddedResult, 1, 'Job log added successfully')
        return q.getJob(savedJob.id)
      }).then((jobsFromDb) => {
        t.equal(jobsFromDb[0].id, savedJob.id, 'Job retrieved successfully')
        t.equal(jobsFromDb[0].log.length, 2, 'Job log exists')
        t.ok(is.date(jobsFromDb[0].log[1].date), 'Log date is a date')
        t.equal(jobsFromDb[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(jobsFromDb[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(jobsFromDb[0].log[1].status, enums.status.created, 'Log status is created')
        t.ok(jobsFromDb[0].log[1].retryCount >= 0, 'Log retryCount is valid')
        t.equal(jobsFromDb[0].log[1].message, tData, 'Log message is valid')
        t.equal(jobsFromDb[0].log[1].data, tData, 'Log data is valid')

        // ---------- Set Job Progress ----------
        t.comment('job: Set Job Progress')
        savedJob.status = enums.status.active
        return savedJob.setProgress(50)
      }).then((progressResult) => {
        t.ok(progressResult, 'Job setProgress returned true')
        return q.getJob(savedJob.id)
      }).then((jobsFromDb) => {
        t.equal(jobsFromDb[0].id, savedJob.id, 'Job retrieved successfully')
        t.equal(jobsFromDb[0].progress, 50, 'Job progress valid')

        // ---------- Update Job ----------
        t.comment('job: Update Job')
        savedJob.newData = tData
        savedJob.timeout = newTimeout
        return savedJob.update(tData)
      }).then((updateResult) => {
        t.equal(updateResult, savedJob.id, 'Job setProgress returned true')
        return q.getJob(savedJob.id)
      }).then((jobsFromDb) => {
        t.equal(jobsFromDb[0].id, savedJob.id, 'Job retrieved successfully')
        t.equal(jobsFromDb[0].newData, tData, 'Job new data valid')
        t.equal(jobsFromDb[0].timeout, newTimeout, 'Job new timeout valid')

        removeEventHandlers()
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
