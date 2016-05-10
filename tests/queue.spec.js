const test = require('tape')
const jobQueue = require('../src/job-queue')
const Promise = require('bluebird')

test('queue test', (t) => {
  t.plan(1)

  let testQueue = jobQueue({ queueName: 'JobQueueUnitTests' })
  testQueue.on('', () => {})

  //console.dir(JSON.parse(JSON.stringify(testQueue)))

  testQueue.createJob({foo: 'bar'}).then((result) => {
    console.log('RESULT!!!!!!!!!!!!!!!!')
    console.dir(JSON.parse(JSON.stringify(result)))
  })

  t.pass('All Done')
})
