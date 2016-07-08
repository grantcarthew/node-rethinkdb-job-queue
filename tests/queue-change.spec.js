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
        enqueue: 0,
        active: 0,
        progress: 0,
        completed: 0,
        cancelled: 0,
        timeout: 0,
        failed: 0,
        retry: 0,
        reset: 0,
        removed: 0
      }
      function addEvents () {
        q.on(enums.status.enqueue, function enqueue (job) {
          ec.enqueue++
          t.ok(is.uuid(job.id), `Event: Enqueue [${ec.enqueue}] [${job.id}]`)
        })
        q.on(enums.status.removed, function removed (jobId) {
          ec.removed++
          t.ok(is.uuid(jobId), `Event: Removed [${ec.removed}] [${job.id}]`)
        })
      }


      const job = q.createJob(testData)

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        q.testing = true
        q.pause()
        q.process((j, next) => {
          t.equal(j.id, job.id, `Job Processed [${j.id}]`)
          next(null, 'queue-change')
        })
        addEvents()
      }).then(() => {
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.removeJob(job.id)
      }).then((resetResult) => {
        t.ok(!q.paused, 'Queue not paused')
        return q.resume()
      }).then(() => {
        t.skip(resetResult >= 0, 'Queue reset')
        // resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
