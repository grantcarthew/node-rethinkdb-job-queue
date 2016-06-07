const test = require('tape')
const testQueue = require('./test-queue')
const dbStatusSummary = require('../src/db-queue-statussummary')

test('db-review test', (t) => {
  t.plan(1)

  dbStatusSummary(testQueue).then((summary) => {
    console.dir(summary)
    t.ok(summary.failed > 0, 'Queue status summary retrieved')
  })
})
