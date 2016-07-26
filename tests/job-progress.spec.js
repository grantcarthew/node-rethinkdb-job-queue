const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const testError = require('./test-error')
const enums = require('../src/enums')
const jobProgress = require('../src/job-progress')
const testData = require('./test-options').testData
const Queue = require('../src/queue')
const testOptions = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job-progress', (t) => {
      t.plan(23)

      const q = new Queue(testOptions.queueDefault())
      const job = q.createJob(testData)
      job.timeout = 300
      job.retryDelay = 600
      job.retryCount = 0

      let testEvents = false
      function progress (jobId, percent) {
        if (testEvents) {
          t.equal(jobId, job.id, `Event: Job progress [${percent}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.progress, progress)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.progress, progress)
      }

      let tempDateRetry = job.dateRetry
      return q.addJob(job).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        addEventHandlers()
        savedJob[0].retryCount = 1
        savedJob[0].status = enums.status.active
        return jobProgress(savedJob[0])
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return job.q.r.db(job.q.db).table(job.q.name).get(job.id).update({
          retryCount: 1
        }).run()
      }).then(() => {
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 0, 'Job progress is 0 when updated with a null value')
        t.ok(
          moment(updatedJob[0].dateRetry).isBetween(moment(tempDateRetry),
            moment().add(updatedJob[0].timeout + 2, 'seconds')),
          'Job dateRetry updated successfully'
        )
        updatedJob[0].status = enums.status.active
        return jobProgress(updatedJob[0], -10)
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 0, 'Job progress is 0 when updated with negative value')
        t.ok(
          moment(updatedJob[0].dateRetry).isBetween(moment(tempDateRetry),
            moment().add((updatedJob[0].timeout + 2) + updatedJob[0].retryDelay, 'seconds')),
          'Job dateRetry updated successfully'
        )
        updatedJob[0].status = enums.status.active
        return jobProgress(updatedJob[0], 1)
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 1, 'Job progress is 1 percent')
        updatedJob[0].status = enums.status.active
        return jobProgress(updatedJob[0], 50)
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 50, 'Job progress is 50 percent')
        updatedJob[0].status = enums.status.active
        return jobProgress(updatedJob[0], 100)
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 100, 'Job progress is 100 percent')
        updatedJob[0].status = enums.status.active
        return jobProgress(updatedJob[0], 101)
      }).then((updatedJob) => {
        t.ok(updatedJob, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 100, 'Job progress is 100 when updated with larger value')
        updatedJob[0].status = enums.status.failed
        return jobProgress(updatedJob[0], 101)
      }).then((inactiveResult) => {
        t.notOk(inactiveResult, 'Inactive job returns false')

        removeEventHandlers()
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
