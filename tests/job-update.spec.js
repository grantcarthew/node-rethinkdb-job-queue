const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const jobUpdate = require('../src/job-update')
const tData = require('./test-options').tData
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'job-update'

jobUpdateTests()
function jobUpdateTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(55)

      const q = new Queue(tOpts.cxn(), tOpts.default('jobUpdate'))
      let job = q.createJob()
      job.data = tData
      let tDate = new Date()

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 0,
        progress: 0,
        pausing: 0,
        paused: 0,
        resumed: 0,
        removed: 0,
        reset: 1,
        error: 0,
        reviewed: 0,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 0,
        waiting: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
        terminated: 0,
        reanimated: 0,
        log: 0,
        updated: 1
      }

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.getJob(job)
      }).then((savedJobs1) => {
        t.equal(savedJobs1[0].id, job.id, 'Job retrieved successfully')
        t.equal(savedJobs1[0].data, tData, 'Job data is valid')
        t.equal(savedJobs1[0].log.length, 1, 'Job log is valid')

        // ---------- Job Update Test ----------
        eventHandlers.add(t, q, state)
        t.comment('job-update: Update')
        job = savedJobs1[0]
        job.newData = tData
        job.dateEnable = tDate
        return jobUpdate(job)
      }).then((updateResult) => {
        t.ok(is.job(updateResult), 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].status, job.status, 'Updated job status is valid')
        t.equal(updatedJob[0].progress, job.progress, 'Updated job progress is valid')
        t.equal(updatedJob[0].queueId, q.id, 'Updated job queueId is valid')
        t.equal(updatedJob[0].log.length, 2, 'Updated job log is valid')
        t.ok(is.date(updatedJob[0].log[1].date), 'Updated log date is a date')
        t.equal(updatedJob[0].log[1].queueId, q.id, 'Updated log queueId is valid')
        t.equal(updatedJob[0].log[1].type, enums.log.information, 'Updated log type is information')
        t.equal(updatedJob[0].log[1].status, job.status, 'Updated log status is valid')
        t.equal(updatedJob[0].log[1].message, enums.message.jobUpdated, 'Updated log message is present')
        t.equal(updatedJob[0].log[1].data.data, tData, 'Updated log data.data is present')
        t.ok(is.date(updatedJob[0].log[1].data.dateCreated), 'Updated log data.dateCreated is a date')
        t.ok(is.date(updatedJob[0].log[1].data.dateEnable), 'Updated log data.dateEnable is a date')
        t.ok(is.uuid(updatedJob[0].log[1].data.id), 'Updated log data.id is a uuid')
        t.ok(is.number(updatedJob[0].log[1].data.priority), 'Updated log data.priority is a number')
        t.ok(is.number(updatedJob[0].log[1].data.progress), 'Updated log data.progress is a number')
        t.ok(is.string(updatedJob[0].log[1].data.queueId), 'Updated log data.queueId is a string')
        t.ok(is.number(updatedJob[0].log[1].data.retryCount), 'Updated log data.retryCount is a number')
        t.ok(is.number(updatedJob[0].log[1].data.retryDelay), 'Updated log data.retryDelay is a number')
        t.ok(is.number(updatedJob[0].log[1].data.retryMax), 'Updated log data.retryMax is a number')
        t.ok(is.string(updatedJob[0].log[1].data.status), 'Updated log data.status is a string')
        t.ok(is.number(updatedJob[0].log[1].data.timeout), 'Updated log data.timeout is a number')
        t.equal(updatedJob[0].newData, tData, 'New job data is valid')
        t.equal(updatedJob[0].dateEnable.toString(), tDate.toString(), 'New job dateEnable is valid')

        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
