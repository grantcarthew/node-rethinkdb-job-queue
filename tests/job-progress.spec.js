const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const jobProgress = require('../src/job-progress')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job-progress', (t) => {
      t.plan(20)

      const q = testQueue()
      const job = q.createJob(testData)
      function progress (jobId, percent) {
        t.equal(jobId, job.id, `Event: Job progress [${percent}]`)
      }
      q.on(enums.status.progress, progress)

      return q.addJob(job).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return jobProgress(savedJob[0])
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 0, 'Job progress is 0 when updated with a null value')
        return jobProgress(updatedJob[0], -10)
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 0, 'Job progress is 0 when updated with negative value')
        return jobProgress(updatedJob[0], 1)
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 1, 'Job progress is 1 percent')
        return jobProgress(updatedJob[0], 50)
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 50, 'Job progress is 50 percent')
        return jobProgress(updatedJob[0], 100)
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 100, 'Job progress is 100 percent')
        return jobProgress(updatedJob[0], 101)
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 100, 'Job progress is 100 when updated with larger value')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.removeListener(enums.status.progress, progress)
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
