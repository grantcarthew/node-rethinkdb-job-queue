const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const queueRemoveJob = require('../src/queue-remove-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-remove-job test', (t) => {
      t.plan(15)

      const q = testQueue()
      let jobs = q.createJob(testData, null, 3)

      return q.addJob(jobs).then((savedJobs) => {
        t.equal(savedJobs.length, 3, 'Jobs saved successfully')
        return queueRemoveJob(q, savedJobs)
      }).then((removeResult) => {
        t.equal(removeResult, 3, 'Jobs removed successfully')
        return q.getJob(jobs.map(j => j.id))
      }).then((getResult) => {
        t.equal(getResult.length, 0, 'Jobs no longer in database')
        let jobs = q.createJob(testData, null, 3)
        return q.addJob(jobs)
      }).then((savedAgain) => {
        t.equal(savedAgain.length, 3, 'Jobs saved successfully (again)')
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
        return queueRemoveJob(q, saveSingle2[0].id)
      }).then((removeSingleResult2) => {
        t.equal(removeSingleResult2, 1, 'Single job removed by id successfully')
        return q.getJob(jobs.id)
      }).then((getResult4) => {
        t.equal(getResult4.length, 0, 'Single job no longer in database')
        return queueRemoveJob(q)
      }).then((undefinedResult) => {
        console.dir(undefinedResult)
        t.equal(undefinedResult, 0, 'Remove undefined job returns 0 result')
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
