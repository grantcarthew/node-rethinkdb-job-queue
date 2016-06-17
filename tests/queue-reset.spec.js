const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const queueReset = require('../src/queue-reset')
const enums = require('../src/enums')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-reset test', (t) => {
      t.plan(7)

      const q = testQueue()
      const jobs = [
        q.createJob(testData),
        q.createJob(testData),
        q.createJob(testData)
      ]
      let eventCount = 0
      function resetEventHandler (total) {
        eventCount++
        t.pass('Queue raised reset event')
        if (eventCount < 2) { return }
        t.equal(total, 3, 'Queue reset removed valid number of jobs')
        return q.getStatusSummary().then((afterSummary) => {
          t.equal(afterSummary.waiting, 0, 'Status summary contains no waiting jobs')
          q.removeListener(enums.queueStatus.reset, resetEventHandler)
          resolve()
        }).catch(err => testError(err, module, t))
      }
      q.on(enums.queueStatus.reset, resetEventHandler)

      return q.reset().then((initialDelete) => {
        t.ok(initialDelete >= 0, 'Initial reset succeeded')
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 3, 'Jobs saved successfully')
        return q.getStatusSummary()
      }).then((beforeSummary) => {
        t.equal(beforeSummary.waiting, 3, 'Status summary contains correct value')
        return queueReset(q)
      }).catch(err => testError(err, module, t))
    })
  })
}
