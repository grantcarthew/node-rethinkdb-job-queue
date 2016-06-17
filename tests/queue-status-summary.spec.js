const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const dbStatusSummary = require('../src/queue-status-summary')
const queueAddJob = require('../src/queue-add-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-status-summary test', (t) => {
      t.plan(7)

      const q = testQueue()
      const jobs = q.createJob(testData, null, 7)
      jobs[0].status = 'waiting'
      jobs[1].status = 'active'
      jobs[2].status = 'completed'
      jobs[3].status = 'timeout'
      jobs[4].status = 'delayed'
      jobs[5].status = 'retry'
      jobs[6].status = 'failed'

      return q.reset().then(() => {
        return queueAddJob(q, jobs, true)
      }).then(() => {
        return dbStatusSummary(q)
      }).then((summary) => {
        t.equal(summary.waiting, 1, 'Queue status summary includes waiting')
        t.equal(summary.active, 1, 'Queue status summary includes active')
        t.equal(summary.completed, 1, 'Queue status summary includes completed')
        t.equal(summary.timeout, 1, 'Queue status summary includes timeout')
        t.equal(summary.delayed, 1, 'Queue status summary includes delayed')
        t.equal(summary.retry, 1, 'Queue status summary includes retry')
        t.equal(summary.failed, 1, 'Queue status summary includes failed')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
