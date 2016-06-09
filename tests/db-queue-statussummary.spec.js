const test = require('tape')
const Promise = require('bluebird')
const testQueue = require('./test-queue')
const dbStatusSummary = require('../src/db-queue-statussummary')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-queue-statussummary test', (t) => {
      t.plan(4)

      const q = testQueue()

      dbStatusSummary(q).then((summary) => {
        t.ok(summary.failed > 0, 'Queue status summary includes failed')
        t.ok(summary.completed > 0, 'Queue status summary includes completed')
        t.ok(summary.waiting > 0, 'Queue status summary includes waiting')
        t.ok(summary.timeout > 0, 'Queue status summary includes timeout')
      }).then(() => {
        resolve()
      }).catch(err => t.fail(err))
    })
  })
}
