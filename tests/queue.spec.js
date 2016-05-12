const test = require('tape')
const jobQueue = require('../src/queue')
const Promise = require('bluebird')

test('queue test', (t) => {
  t.plan(1)

  let testQueue = jobQueue({ queueName: 'JobQueueUnitTests' })
  let jobs = []
  //console.dir(JSON.parse(JSON.stringify(testQueue)))
  let ej = testQueue.createJob()
  ej.id = 'ba3002c6-193f-4957-bc13-a4c3871629d7'
  //jobs.push(ej)
  for (let i = 0; i < 10; i++) {
    jobs.push(testQueue.createJob({foo: i}))
  }

  testQueue.on('enqueue', (job) => {
    console.log('enqueue')
  })
  testQueue.process((job) => {
    console.log(job.id)
  })

  testQueue.addJob(jobs).then((result) => {
    console.log('RESULT!!!!!!!!!!!!!!!!')
    console.dir(JSON.parse(JSON.stringify(result)))
    setTimeout(() => { result.remove() }, 3000)
  }).then(() => {
    // return testQueue.getNextJob().then((job) => {
    //   console.log('NEXT JOB!!!!!!!!!!!!!!!!');
    //   console.dir(job)
    //   return job
    // })
  }).then((newJob) => {
    // return newJob.setStatus('active').then((updateResult) => {

    // })
  })

  t.pass('All Done')
})
