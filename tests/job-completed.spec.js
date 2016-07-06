const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const jobCompleted = require('../src/job-completed')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job-completed', (t) => {
      t.plan(18)

      const q = testQueue()
      const job = q.createJob(testData)
      function completed (jobId) {
        t.equal(jobId, job.id, `Event: Job completed`)
      }
      q.on(enums.status.completed, completed)

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return jobCompleted(savedJob[0], testData)
      }).then((changeResult) => {
        t.equal(changeResult, 1, 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].status, enums.status.completed, 'Job status is completed')
        t.ok(moment.isDate(updatedJob[0].dateCompleted), 'Job dateCompleted is a date')
        t.equal(updatedJob[0].progress, 100, 'Job progress is 100')
        t.equal(updatedJob[0].queueId, q.id, 'Job queueId is valid')
        t.equal(updatedJob[0].log.length, 1, 'Job log exists')
        t.ok(moment.isDate(updatedJob[0].log[0].date), 'Log date is a date')
        t.equal(updatedJob[0].log[0].queueId, q.id, 'Log queueId is valid')
        t.equal(updatedJob[0].log[0].type, enums.log.information, 'Log type is information')
        t.equal(updatedJob[0].log[0].status, enums.status.completed, 'Log status is completed')
        t.ok(updatedJob[0].log[0].retryCount >= 0, 'Log retryCount is valid')
        t.ok(updatedJob[0].log[0].message, 'Log message is present')
        t.ok(updatedJob[0].log[0].duration >= 0, 'Log duration is >= 0')
        t.equal(updatedJob[0].log[0].data, testData, 'Log data is valid')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.removeListener(enums.status.completed, completed)
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
