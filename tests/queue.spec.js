const test = require('tape')
const Queue = require('../src/queue')
const Promise = require('bluebird')
const customJobDefaultOptions = {
  priority: 'highest',
  timeout: 20,
  retryMax: 2,
  retryDelay: 20
}

test('queue test', (t) => {
  t.plan(6)

  const testQ = new Queue({ queueName: 'JobQueueUnitTests' }, 'enabled')
  testQ.jobDefaultOptions = customJobDefaultOptions
  t.deepEqual(testQ.jobDefaultOptions, customJobDefaultOptions, 'Set default job options')
  testQ.on('ready', () => {
    t.pass('Queue ready event called')
  })
  testQ.on('enqueue', (job) => {
    t.pass('Queue enqueue event called')
  })
  testQ.on('progress', (progressValue) => {
    t.pass('Queue progress event called')
  })
  testQ.on('success', (jobId) => {
    t.pass('Queue success event called')
  })
  testQ.on('failure', (jobId) => {
    t.pass('Queue failure event called')
  })
  testQ.on('retry', (jobId) => {
    t.pass('Queue retry event called')
  })
  testQ.on('idle', (jobId) => {
    t.pass('Queue idle event called')
  })


  testQ.process((job) => {
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
  // console.dir(JSON.parse(JSON.stringify(testQ)))
  let ej = testQ.createJob()
  ej.id = 'ba3002c6-193f-4957-bc13-a4c3871629d7'
  // jobs.push(ej)
  for (let i = 0; i < 2; i++) {
    jobs.push(testQ.createJob({foo: i}))
  }

  testQ.addJob(jobs).then((result) => {
    console.log('RESULT!!!!!!!!!!!!!!!!')
    console.dir(JSON.parse(JSON.stringify(result)))
  }).then(() => {
    return testQ.getNextJob()
  }).then((a) => {
      console.log('NEXT JOB')
      console.dir(a)
      return testQ.getJob('142ad740-8bfc-4491-9d3d-b126d1064af6')
  }).then((b) => {
      console.log('SPECIFIC JOB')
      console.dir(b)
    }).then((c) => {
        // console.log('STALL TEST')
        // console.dir(c)
      }).then(() => {
        return testQ.statusSummary
      }).then((d) => {
          console.log('STATUS SUMMARY')
          console.dir(d)
        }).then(() => {
      //return testQ.delete()
    }).then(() => {
    //testQ.r.getPoolMaster().drain()
  })

})
