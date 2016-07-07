const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const enums = require('../src/enums')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const queueRemoveJob = require('../src/queue-remove-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-remove-job', (t) => {
      t.plan(16)

      const q = testQueue()
      let jobs = q.createJob(testData, 3)

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 3, 'Jobs saved successfully')

        // ---------- Remove by Job Object Tests ----------
        t.comment('queue-remove-job: Remove by Jobs')
        return queueRemoveJob(q, savedJobs)
      }).then((removeResult) => {
        t.equal(removeResult, 3, 'Jobs removed successfully')
        return q.getJob(jobs.map(j => j.id))
      }).then((getResult) => {
        t.equal(getResult.length, 0, 'Jobs no longer in database')
        let jobs = q.createJob(testData, 3)
        return q.addJob(jobs)
      }).then((savedAgain) => {
        t.equal(savedAgain.length, 3, 'Jobs saved successfully (again)')

        // ---------- Remove by Ids Tests ----------
        t.comment('queue-remove-job: Remove by Ids')
        return queueRemoveJob(q, savedAgain.map(j => j.id))
      }).then((removeIdResult) => {
        t.equal(removeIdResult, 3, 'Jobs removed by id successfully')
        return q.getJob(jobs.map(j => j.id))
      }).then((getResult2) => {
        t.equal(getResult2.length, 0, 'Jobs no longer in database')
        jobs = q.createJob(testData)
        return q.addJob(jobs)
      }).then((saveSingle) => {
        t.equal(saveSingle.length, 1, 'Single job saved successfully')

        // ---------- Remove Single Job Tests ----------
        t.comment('queue-remove-job: Remove Single Job')
        return queueRemoveJob(q, saveSingle)
      }).then((removeSingleResult) => {
        t.equal(removeSingleResult, 1, 'Single job removed successfully')
        return q.getJob(jobs.id)
      }).then((getResult3) => {
        t.equal(getResult3.length, 0, 'Single job no longer in database')
        jobs = q.createJob(testData)
        return q.addJob(jobs)
      }).then((saveSingle2) => {
        t.equal(saveSingle2.length, 1, 'Single job saved successfully (again)')

        // ---------- Remove Single Job by Id Tests ----------
        t.comment('queue-remove-job: Remove Single Job by Id')
        return queueRemoveJob(q, saveSingle2[0].id)
      }).then((removeSingleResult2) => {
        t.equal(removeSingleResult2, 1, 'Single job removed by id successfully')
        return q.getJob(jobs.id)
      }).then((getResult4) => {
        t.equal(getResult4.length, 0, 'Single job no longer in database')

        // ---------- Remove Undefined Job Tests ----------
        t.comment('queue-remove-job: Remove Undefined Job')
        return queueRemoveJob(q)
      }).then((undefinedResult) => {
        t.equal(undefinedResult, 0, 'Remove undefined job returns 0 result')

        // ---------- Remove Invalid Job Tests ----------
        t.comment('queue-remove-job: Remove Invalid Job')
        return queueRemoveJob(q, ['not a job']).then(() => {
          t.fail('queue-remove-job is not failing on an invalid job')
        }).catch((err) => {
          t.ok(err.message.includes(enums.error.idInvalid), 'Invalid job returns a rejected Promise')
        })
      }).then(() => {
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
