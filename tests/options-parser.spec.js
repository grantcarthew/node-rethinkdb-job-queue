const test = require('tape')
const parser = require('../src/options-parser')
const optionsConnectDefault = {
  dbHost: 'localhost',
  dbName: 'JobQueue',
  dbPort: '28015'
}
const optionsCreateDefault = {
  queueName: 'JobQueue',
  stallInterval: 30
}
const optionsConnectNonDefault = {
  dbHost: 'localhost',
  dbName: 'JobQueue',
  dbPort: '28015'
}
const optionsCreateNonDefault = {
  queueName: 'EmailJobs',
  stallInterval: 120
}

test('options-parser tests', (t) => {
  t.plan(5)
  t.throws(() => { parser() }, 'Throws error with invalid use of parser')
  t.deepEqual(parser.connect(), optionsConnectDefault, 'Returns default connect options')
  t.deepEqual(parser.create(), optionsCreateDefault, 'Returns default create options')
  t.deepEqual(parser.connect(optionsConnectNonDefault), optionsConnectNonDefault, 'Return connect options with non-defaults')
  t.deepEqual(parser.create(optionsCreateNonDefault), optionsCreateNonDefault, 'Return create options with non-defaults')
})
