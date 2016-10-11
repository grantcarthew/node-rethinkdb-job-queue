const test = require('tape')
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const jobAddLog = require('../src/job-add-log')
const Job = require('../src/job')
const tData = require('./test-options').tData
const lData = require('./test-options').lData
const Queue = require('../src/queue')
const tOpts = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job', (t) => {
      t.plan(81)

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
      t.equal(newJob.status, enums.status.created, 'New job status is created')
      t.equal(newJob.timeout, enums.options.timeout, 'New job timeout is valid')
      t.equal(newJob.retryMax, enums.options.retryMax, 'New job retryMax is valid')
      t.equal(newJob.retryDelay, enums.options.retryDelay, 'New job retryDelay is valid')
      t.equal(newJob.progress, 0, 'New job progress is 0')
      t.equal(newJob.queueId, q.id, 'New job queueId is valid')
      t.equal(newJob.retryCount, 0, 'New job retryCount is 0')
      t.equal(newJob.log.length, 0, 'New job log is an empty array')
      t.ok(is.date(newJob.dateCreated), 'New job dateCreated is a date')
      t.ok(is.date(newJob.dateEnable), 'New job dateEnable is a date')

      // ---------- Change Options Tests ----------
      t.comment('job: Change Options')
      t.throws(() => { newJob.setPriority('not valid') }, 'Job setPriority thows if invalid')
      newJob.setPriority('highest')
      t.equal(newJob.priority, 'highest', 'Job setPriority successfully changed value')
      t.throws(() => { newJob.setTimeout('not valid') }, 'Job setTimeout thows if invalid')
      newJob.setTimeout(100)
      t.equal(newJob.timeout, 100, 'Job setTimeout successfully changed value')
      t.throws(() => { newJob.setRetryMax('not valid') }, 'Job setRetryMax thows if invalid')
      newJob.setRetryMax(100)
      t.equal(newJob.retryMax, 100, 'Job setRetryMax successfully changed value')
      t.throws(() => { newJob.setRetryDelay('not valid') }, 'Job setRetryDelay thows if invalid')
      newJob.setRetryDelay(100)
      t.equal(newJob.retryDelay, 100, 'Job setRetryDelay successfully changed value')
      t.throws(() => { newJob.setDateEnable('not valid') }, 'Job setDateEnable thows if invalid')
      const testDate = new Date()
      newJob.setDateEnable(testDate)
      t.equal(newJob.dateEnable, testDate, 'Job setDateEnable successfully changed value')

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
      t.equal(cleanJob.priority, newJob.priority, 'Clean job priorityAsString priority is normal')

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(newJob)
      }).then((addedJobs) => {
        savedJob = addedJobs[0]
        t.equal(savedJob.id, newJob.id, 'Job saved successfully')
        let jobCopy = Object.assign({}, savedJob)
        jobCopy.priority = 40

        // ---------- New Job From Data ----------
        t.comment('job: New Job from Job Data')
        return new Job(q, jobCopy)
      }).then((newJobFromData) => {
        t.equal(newJobFromData.id, savedJob.id, 'New job from data created successfully')
        t.deepEqual(newJobFromData.q, savedJob.q, 'New job from data queue valid')
        t.equal(newJobFromData.data, savedJob.data, 'New job from data job data is valid')
        t.equal(newJobFromData.priority, 'normal', 'New job from data priority is valid')
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

        // ---------- New Jobs with Data and Options ----------
        t.comment('job: New Job with Data and Options')
        let custJob = new Job(q, { foo: 'bar' })
        t.equal(custJob.foo, 'bar', 'New job with object data created successfully')
        custJob = new Job(q, 'bar')
        t.equal(custJob.data, 'bar', 'New job with string data created successfully')
        custJob = new Job(q, 1234)
        t.equal(custJob.data, 1234, 'New job with number data created successfully')
        custJob = new Job(q, true)
        t.ok(is.true(custJob.data), 'New job with boolean data created successfully')
        custJob = new Job(q, [1, 2, 3])
        t.ok(is.array(custJob.data), 'New job with array data created successfully')
        custJob = new Job(q, { object: { foo: 'bar' }, priority: 'high' })
        t.equal(custJob.object.foo, 'bar', 'New job with child object data created successfully')
        t.equal(custJob.priority, 'high', 'New job with new priority created successfully')
        t.throws(() => { new Job(q, () => { }) }, 'New job with function throws error')

        // ---------- Add Job Log ----------
        t.comment('job: Add Job Log')
        return savedJob.addLog(tData, tData)
      }).then((logAddedResult) => {
        t.ok(logAddedResult, 'Job log added successfully')
        return q.getJob(savedJob.id)
      }).then((jobsFromDb) => {
        t.equal(jobsFromDb[0].id, savedJob.id, 'Job retrieved successfully')
        t.equal(jobsFromDb[0].log.length, 2, 'Job log exists')
        t.ok(is.date(jobsFromDb[0].log[1].date), 'Log date is a date')
        t.equal(jobsFromDb[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(jobsFromDb[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(jobsFromDb[0].log[1].status, enums.status.waiting, 'Log status is valid')
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
