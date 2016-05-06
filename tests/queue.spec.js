const test = require('tape')
const jobQueue = require('../src/job-queue')

test('queue test', (t) => {
  t.plan(1)

  let qFactory = jobQueue.connect({
    dbName: 'UnitTests'
  })

  let emailQueue = qFactory.create({
    queueName: 'email'
  })
})
