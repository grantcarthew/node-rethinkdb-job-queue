const test = require('tape')
const jobQueue = require('../src/queue')
const Promise = require('bluebird')
const qm = require('../src/queue-maintenance')

test('queue test', (t) => {
  t.plan(2)

  let unitTestQueue = new jobQueue({ queueName: 'JobQueueUnitTests' }, 'enabled')
  unitTestQueue.on('enqueue', (job) => {
    console.log('~~~~~~~~~~~~~~~~ enqueue ~~~~~~~~~~~~~~~~~')
    console.log(job.id)
  })
  unitTestQueue.on('ready', () => {
    t.pass('Ready event called')
  })

  unitTestQueue.process((job) => {
    console.log('~~~~~~~~~~~~~~~~ process ~~~~~~~~~~~~~~~~~')
    console.log(job.id)
  })

  let jobs = []
  // console.dir(JSON.parse(JSON.stringify(unitTestQueue)))
  let ej = unitTestQueue.createJob()
  ej.id = 'ba3002c6-193f-4957-bc13-a4c3871629d7'
  // jobs.push(ej)
  for (let i = 0; i < 2; i++) {
    jobs.push(unitTestQueue.createJob({foo: i}, {priority: 'highest'}))
  }

  unitTestQueue.addJob(jobs).then((result) => {
    console.log('RESULT!!!!!!!!!!!!!!!!')
    console.dir(JSON.parse(JSON.stringify(result)))
  }).then(() => {
    return unitTestQueue.getNextJob()
  }).then((a) => {
      console.log('NEXT JOB')
      console.dir(a)
      return unitTestQueue.getJob('142ad740-8bfc-4491-9d3d-b126d1064af6')
  }).then((b) => {
      console.log('SPECIFIC JOB')
      console.dir(b)
      return qm(unitTestQueue)
  }).then((c) => {
      console.log('STALL TEST')
      console.dir(c)
    }).then(() => {
      //return unitTestQueue.delete()
    }).then(() => {
    unitTestQueue.r.getPoolMaster().drain()
  })

  t.pass('All Done')
})
