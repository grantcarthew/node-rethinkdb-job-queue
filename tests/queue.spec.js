const test = require('tape')
const jobQueue = require('../src/queue')
const Promise = require('bluebird')

test('queue test', (t) => {
  t.plan(1)

  let unitTestQueue = jobQueue({ queueName: 'JobQueueUnitTests' })
  unitTestQueue.on('enqueue', (job) => {
    console.log('~~~~~~~~~~~~~~~~ enqueue ~~~~~~~~~~~~~~~~~')
    console.log(job.id)
  })
  unitTestQueue.getNextJob().then((j) => {
    console.log('NEXT JOB');
    console.dir(j)
  })

  unitTestQueue.process((job) => {
    console.log('~~~~~~~~~~~~~~~~ process ~~~~~~~~~~~~~~~~~')
    console.log(job.id)
  })

  let jobs = []
  //console.dir(JSON.parse(JSON.stringify(unitTestQueue)))
  let ej = unitTestQueue.createJob()
  ej.id = 'ba3002c6-193f-4957-bc13-a4c3871629d7'
  //jobs.push(ej)
  for (let i = 0; i < 2; i++) {
    jobs.push(unitTestQueue.createJob({foo: i}, {priority: 'high'}))
  }

  unitTestQueue.addJob(jobs).then((result) => {
    console.log('RESULT!!!!!!!!!!!!!!!!')
    console.dir(JSON.parse(JSON.stringify(result)))
    setTimeout(() => { result.remove() }, 2000)
  }).then(() => {
    // return unitTestQueue.getNextJob().then((job) => {
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
