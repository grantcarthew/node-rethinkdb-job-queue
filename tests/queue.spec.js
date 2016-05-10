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
    setTimeout(() => { result.remove() }, 3000)
  }).then(() => {
    return testQueue.getNextJob().then((job) => {
      console.log('NEXT JOB!!!!!!!!!!!!!!!!');
      console.dir(job)
      return job
    })
  }).then((newJob) => {
    return newJob.setStatus('active').then((updateResult) => {

    })
  })

  t.pass('All Done')
})
