const test = require('tape')
const jobQueue = require('../src/queue')
const Promise = require('bluebird')

test('queue test', (t) => {
  t.plan(4)

  let unitTestQueue = new jobQueue({ queueName: 'JobQueueUnitTests' }, 'enabled')
  unitTestQueue.jobDefaultOptions = {priority: 'highest', timeout: 20}
  unitTestQueue.on('enqueue', (job) => {
    t.pass('Enqueue event called')
  })
  unitTestQueue.on('ready', () => {
    t.pass('Ready event called')
  })

  unitTestQueue.process((job) => {
    console.log('~~~~~~~~~~~~~~~~ process ~~~~~~~~~~~~~~~~~')
    console.log(job.id)
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log('~~~~~~~~~~~~~~~~ process timeout ~~~~~~~~~~~~~~~~~')
        resolve()
      }, 3000)
    })
  })

  let jobs = []
  // console.dir(JSON.parse(JSON.stringify(unitTestQueue)))
  let ej = unitTestQueue.createJob()
  ej.id = 'ba3002c6-193f-4957-bc13-a4c3871629d7'
  // jobs.push(ej)
  for (let i = 0; i < 2; i++) {
    jobs.push(unitTestQueue.createJob({foo: i}))
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
    }).then((c) => {
        // console.log('STALL TEST')
        // console.dir(c)
      }).then(() => {
        return unitTestQueue.statusSummary
      }).then((d) => {
          console.log('STATUS SUMMARY')
          console.dir(d)
        }).then(() => {
      //return unitTestQueue.delete()
    }).then(() => {
    //unitTestQueue.r.getPoolMaster().drain()
  })

  t.pass('All Done')
})
