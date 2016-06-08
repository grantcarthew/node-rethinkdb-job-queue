const test = require('tape')
const Promise = require('bluebird')
const testQueue = require('./test-queue')
const dbStatusSummary = require('../src/db-queue-statussummary')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-review test', (t) => {
      t.plan(4)

      const q = testQueue()

      dbStatusSummary(q).then((summary) => {
        console.dir(summary)
        t.ok(summary.failed > 0, 'Queue status summary retrieved')
        t.ok(summary.completed > 0, 'Queue status summary retrieved')
        t.ok(summary.waiting > 0, 'Queue status summary retrieved')
        t.ok(summary.timeout > 0, 'Queue status summary retrieved')
      }).then(() => {
        resolve()
      }).catch(err => t.fail(err))
    })
  })
}
