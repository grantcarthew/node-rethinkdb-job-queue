const test = require('tape')
const optionParser = require('../src/option-parser')
const optionDefaults = require('../src/option-defaults')
const dbNonDefault = {
  dbHost: 'db01',
  dbName: 'SomeJobQueue',
  dbPort: '8888'
}
const queueNonDefault = {
  stallInterval: 120
}

test('options tests', (t) => {
  t.plan(4)
  t.deepEqual(optionParser.parseDbOptions(), optionDefaults.db, 'Returns default db options')
  t.deepEqual(optionParser.parseQueueOptions(), optionDefaults.queue, 'Returns default queue options')
  t.deepEqual(optionParser.parseDbOptions(dbNonDefault), dbNonDefault, 'Return db options with non-defaults')
  t.deepEqual(optionParser.parseQueueOptions(queueNonDefault).stallInterval, queueNonDefault.stallInterval, 'Return queue options with non-defaults')
})
