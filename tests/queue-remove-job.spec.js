const test = require('tape')
const Promise = require('bluebird')
const is = require('../src/is')
const enums = require('../src/enums')
const tError = require('./test-error')
const queueRemoveJob = require('../src/queue-remove-job')
const Queue = require('../src/queue')
const tOpts = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-remove-job', (t) => {
      t.plan(24)

      const q = new Queue(tOpts.cxn(), tOpts.default())
      let jobs = []
      for (let i = 0; i < 3; i++) {
        jobs.push(q.createJob())
      }

      let testEvents = false
      function removedEventHandler (jobId) {
        if (testEvents) {
          t.ok(is.uuid(jobId), `Event: removed [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.removed, removedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.removed, removedEventHandler)
      }

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        addEventHandlers()
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 3, 'Jobs saved successfully')

        // ---------- Remove by Job Object Tests ----------
        t.comment('queue-remove-job: Remove by Jobs')
        return queueRemoveJob(q, savedJobs)
      }).then((removeResult) => {
        t.equal(removeResult.length, 3, 'Jobs removed successfully')
        return q.getJob(jobs.map(j => j.id))
      }).then((getResult) => {
        t.equal(getResult.length, 0, 'Jobs no longer in database')
        let jobs = []
        for (let i = 0; i < 3; i++) {
          jobs.push(q.createJob())
        }
        return q.addJob(jobs)
      }).then((savedAgain) => {
        t.equal(savedAgain.length, 3, 'Jobs saved successfully (again)')

        // ---------- Remove by Ids Tests ----------
        t.comment('queue-remove-job: Remove by Ids')
        return queueRemoveJob(q, savedAgain.map(j => j.id))
      }).then((removeIdResult) => {
        t.equal(removeIdResult.length, 3, 'Jobs removed by id successfully')
        return q.getJob(jobs.map(j => j.id))
      }).then((getResult2) => {
        t.equal(getResult2.length, 0, 'Jobs no longer in database')
        jobs = q.createJob()
        return q.addJob(jobs)
      }).then((saveSingle) => {
        t.equal(saveSingle.length, 1, 'Single job saved successfully')

        // ---------- Remove Single Job Tests ----------
        t.comment('queue-remove-job: Remove Single Job')
        return queueRemoveJob(q, saveSingle)
      }).then((removeSingleResult) => {
        t.equal(removeSingleResult.length, 1, 'Single job removed successfully')
        return q.getJob(jobs.id)
      }).then((getResult3) => {
        t.equal(getResult3.length, 0, 'Single job no longer in database')
        jobs = q.createJob()
        return q.addJob(jobs)
      }).then((saveSingle2) => {
        t.equal(saveSingle2.length, 1, 'Single job saved successfully (again)')

        // ---------- Remove Single Job by Id Tests ----------
        t.comment('queue-remove-job: Remove Single Job by Id')
        return queueRemoveJob(q, saveSingle2[0].id)
      }).then((removeSingleResult2) => {
        t.equal(removeSingleResult2.length, 1, 'Single job removed by id successfully')
        return q.getJob(jobs.id)
      }).then((getResult4) => {
        t.equal(getResult4.length, 0, 'Single job no longer in database')

        // ---------- Remove Undefined Job Tests ----------
        t.comment('queue-remove-job: Remove Undefined Job')
        return queueRemoveJob(q)
      }).then((undefinedResult) => {
        t.equal(undefinedResult.length, 0, 'Remove undefined job returns 0 result')

        // ---------- Remove Invalid Job Tests ----------
        t.comment('queue-remove-job: Remove Invalid Job')
        return queueRemoveJob(q, ['not a job']).then(() => {
          t.fail('queue-remove-job is not failing on an invalid job')
        }).catch((err) => {
          t.ok(err.message.includes(enums.message.idInvalid), 'Invalid job returns a rejected Promise')
        })
      }).then(() => {
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
