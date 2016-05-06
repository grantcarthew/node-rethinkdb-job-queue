const test = require('tape')
const jobQueue = require('../src/queue-factory')

test('queue test', (t) => {
  t.plan(1)

  console.dir(jobQueue)
  let qFactory = jobQueue.connect({
    dbName: 'UnitTests'
  })
  let qFactory2 = jobQueue.connect({
    dbHost: 'abc',
    dbName: 'UnitTests'
  })
  console.log('11111111111111111111');
  console.dir(qFactory)
  console.log('2222222222222222222222');
  console.dir(qFactory2)

  let emailQueue = qFactory.create('email')
})
