const test = require('tape')
const jobQueue = require('../src/job-queue')
const Promise = require('bluebird')

test('queue test', (t) => {
  t.plan(1)

  let qFactory = jobQueue.connect({
    dbName: 'JobQueueUnitTests'
  })

  let testQueue = qFactory.create({
    queueName: 'UnitTest'
  }).then((result) => {
    console.dir(result)
  })

  console.dir(JSON.parse(JSON.stringify(testQueue)))

  t.pass('All Done')
})
