const test = require('tape')
const Promise = require('bluebird')
const is = require('../src/is')
const enums = require('../src/enums')
const testError = require('./test-error')
const queueReset = require('../src/queue-reset')
const testData = require('./test-options').testData
const Queue = require('../src/queue')
const testOptions = require('./test-options')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-reset', (t) => {
      t.plan(7)

      const q = new Queue(testOptions.default())
      const jobs = [
        q.createJob(testData),
        q.createJob(testData),
        q.createJob(testData)
      ]
      let eventCount = 0
      function resetEventHandler (total) {
        eventCount++
        t.pass('Event: Queue reset')
        if (eventCount < 2) { return }
        t.equal(total, 3, 'Queue reset removed valid number of jobs')
        return q.summary().then((afterSummary) => {
          t.equal(afterSummary.added, 0, 'Status summary contains no added jobs')
          q.removeListener(enums.status.reset, resetEventHandler)
          q.stop()
          return resolve(t.end())
        }).catch(err => testError(err, module, t))
      }
      q.on(enums.status.reset, resetEventHandler)

      return q.reset().then((removed) => {
        t.ok(is.integer(removed), 'Initial reset succeeded')
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 3, 'Jobs saved successfully')
        return q.summary()
      }).then((beforeSummary) => {
        t.equal(beforeSummary.added, 3, 'Status summary contains correct value')
        return queueReset(q)
      }).catch(err => testError(err, module, t))
    })
  })
}
