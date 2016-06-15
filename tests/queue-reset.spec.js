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
      t.plan(5)

      const q = testQueue()
      const jobs = [
        q.createJob(testData),
        q.createJob(testData),
        q.createJob(testData)
      ]

      let resetTestCompleted = false
      q.on(enums.queueStatus.reset, (total) => {
        if (resetTestCompleted) { return }
        resetTestCompleted = true
        t.pass('Queue raised reset event')
        t.equal(total, 31, 'Queue reset removed valid number of jobs')
        return q.getStatusSummary().then((afterSummary) => {
          t.equal(Object.keys(afterSummary).length, 0, 'Status summary contains no values')
          resolve()
        }).catch(err => testError(err, module, t))
      })

      return q.addJob(jobs).then((savedJobs) => {
        t.equal(savedJobs.length, 3, 'Jobs saved successfully')
        return q.getStatusSummary()
      }).then((beforeSummary) => {
        t.equal(Object.keys(beforeSummary).length, 5, 'Status summary contains correct value')
        return queueReset(q)
      }).catch(err => testError(err, module, t))
    })
  })
}
