const test = require('tape')
const Promise = require('bluebird')
const datetime = require('../src/datetime')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const jobUpdate = require('../src/job-update')
const tData = require('./test-options').tData
const Queue = require('../src/queue')
const tOpts = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job-update', (t) => {
      t.plan(19)

      const q = new Queue(tOpts.cxn(), tOpts.default())
      let job = q.createJob()
      job.data = tData
      let tDate = new Date()

      // ---------- Event Handler Setup ----------
      let testEvents = false
      function updatedEventHandler (jobId) {
        if (testEvents) {
          t.equal(jobId, job.id, `Event: updated [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.updated, updatedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.updated, updatedEventHandler)
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
        addEventHandlers()
        t.comment('job-update: Update')
        job = savedJobs1[0]
        job.newData = tData
        job.dateEnable = tDate
        return jobUpdate(job, tData)
      }).then((jobId) => {
        t.equal(jobId, job.id, 'Job updated successfully')
        return q.getJob(jobId)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].status, job.status, 'Updated job status is valid')
        t.equal(updatedJob[0].progress, job.progress, 'Updated job progress is valid')
        t.equal(updatedJob[0].queueId, q.id, 'Updated job queueId is valid')
        t.equal(updatedJob[0].log.length, 2, 'Updated job log is valid')
        t.ok(is.date(updatedJob[0].log[1].date), 'Updated log date is a date')
        t.equal(updatedJob[0].log[1].queueId, q.id, 'Updated log queueId is valid')
        t.equal(updatedJob[0].log[1].type, enums.log.information, 'Updated log type is information')
        t.equal(updatedJob[0].log[1].status, job.status, 'Updated log status is valid')
        t.equal(updatedJob[0].log[1].message, tData, 'Updated log message is present')
        t.equal(updatedJob[0].newData, tData, 'New job data is valid')
        t.equal(updatedJob[0].dateEnable.toString(), tDate.toString(), 'New job dateEnable is valid')

        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        removeEventHandlers()
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
