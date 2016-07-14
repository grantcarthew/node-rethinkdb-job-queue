const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const queueAddJob = require('../src/queue-add-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-change', (t) => {
      t.plan(30)

      const q = testQueue()
      let ec = {
        added: 0,
        active: 0,
        progress: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
        reset: 0,
        removed: 0
      }
      function addEvents () {
        q.on(enums.status.added, function added (jobId) {
          ec.added++
          t.ok(is.uuid(jobId), `Event: added [${ec.added}] [${jobId}]`)
        })
        q.on(enums.status.active, function active (jobId) {
          ec.active++
          t.ok(is.uuid(jobId), `Event: active [${ec.active}] [${jobId}]`)
        })
        q.on(enums.status.completed, function completed (jobId) {
          ec.completed++
          t.ok(is.uuid(jobId), `Event: completed [${ec.completed}] [${jobId}]`)
        })
        q.on(enums.status.removed, function removed (jobId) {
          ec.removed++
          t.ok(is.uuid(jobId), `Event: Removed [${ec.removed}] [${jobId}]`)
        })
      }

      const job = q.createJob(testData)

      return q.reset().then((resetResult) => {
        return q.pause()
      }).then(() => {
        t.ok(is.integer(resetResult), 'Queue reset')
        q.testing = true
        q.process((j, next) => {
          t.equal(j.id, job.id, `Job Processed [${j.id}]`)
          next(null, 'queue-change')
        })
        addEvents()
      }).then(() => {
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.resume()
      }).then(() => {
        t.ok(!q.paused, 'Queue not paused')
        //return q.removeJob(job.id)
      }).then((removeResult) => {
        //return q.reset()
      }).then((resetResult) => {
        t.skip(resetResult >= 0, 'Queue reset')
        // resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
