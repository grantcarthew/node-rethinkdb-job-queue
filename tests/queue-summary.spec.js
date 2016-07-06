const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const enums = require('../src/enums')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const queueSummary = require('../src/queue-summary')
const queueAddJob = require('../src/queue-add-job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-summary', (t) => {
      t.plan(10)

      const q = testQueue()
      const jobs = q.createJob(testData, null, 8)
      jobs[0].status = 'waiting'
      jobs[1].status = 'active'
      jobs[2].status = 'completed'
      jobs[3].status = 'cancelled'
      jobs[4].status = 'timeout'
      jobs[5].status = 'delayed'
      jobs[6].status = 'retry'
      jobs[7].status = 'failed'

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return queueAddJob(q, jobs, true)
      }).then(() => {
        return queueSummary(q)
      }).then((summary) => {
        t.equal(summary.waiting, 1, 'Queue status summary includes waiting')
        t.equal(summary.active, 1, 'Queue status summary includes active')
        t.equal(summary.completed, 1, 'Queue status summary includes completed')
        t.equal(summary.cancelled, 1, 'Queue status summary includes cancelled')
        t.equal(summary.timeout, 1, 'Queue status summary includes timeout')
        t.equal(summary.delayed, 1, 'Queue status summary includes delayed')
        t.equal(summary.retry, 1, 'Queue status summary includes retry')
        t.equal(summary.failed, 1, 'Queue status summary includes failed')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
