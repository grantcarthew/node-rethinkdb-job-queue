const server = require('./reqlite')
const test = require('tape')
const jobQueue = require('../src/job-queue')

test('queue test', (t) => {
  t.plan(1)

  let qFactory = jobQueue.connect({
    dbPort: '28016',
    dbName: 'UnitTests'
  })

  let testQueue = qFactory.create({
    queueName: 'test'
  })

  console.dir(JSON.parse(JSON.stringify(testQueue)))

  t.pass('All Done')
})
