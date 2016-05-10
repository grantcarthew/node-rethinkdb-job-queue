const test = require('tape')
const jobQueue = require('../src/job-queue')
const Promise = require('bluebird')
const dbJob = require('../src/db-job')

test('queue test', (t) => {
  t.plan(1)

  let testQueue = jobQueue({ queueName: 'JobQueueUnitTests' })
  testQueue.on('', () => {})

  //console.dir(JSON.parse(JSON.stringify(testQueue)))

  testQueue.createJob({foo: 'bar'}).then((result) => {
    console.log('RESULT!!!!!!!!!!!!!!!!')
    console.dir(JSON.parse(JSON.stringify(result)))
    setTimeout(() => { dbJob.remove(result) }, 3000)
  })

  t.pass('All Done')
})
