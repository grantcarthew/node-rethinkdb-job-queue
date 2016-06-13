const test = require('tape')
const Promise = require('bluebird')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const dbStatusSummary = require('../src/queue-statussummary')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-statussummary test', (t) => {
      t.plan(4)

      const q = testQueue()

      dbStatusSummary(q).then((summary) => {
        t.ok(summary.failed > 0, 'Queue status summary includes failed')
        t.ok(summary.completed > 0, 'Queue status summary includes completed')
        t.ok(summary.waiting > 0, 'Queue status summary includes waiting')
        t.ok(summary.timeout > 0, 'Queue status summary includes timeout')
      }).then(() => {
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
