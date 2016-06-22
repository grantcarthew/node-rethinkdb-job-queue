const test = require('tape')
const Queue = require('../src/queue')
const Promise = require('bluebird')
const testError = require('./test-error')
const testOptions = require('./test-options')
const connectionOptionsOnly = testOptions.connection()
const queueDefaultOptions = testOptions.queueDefault()
const customJobDefaultOptions = testOptions.jobOptionsHigh()

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue test', (t) => {
      t.plan(6)

      const q = new Queue(connectionOptionsOnly)
      q.on('ready', () => {
        t.pass('Queue ready event called')
      })
      q.on('enqueue', (job) => {
        t.pass('Queue enqueue event called')
      })
      q.on('processing', (processingValue) => {
        t.pass('Queue processing event called')
      })
      q.on('progress', (progressValue) => {
        t.pass('Queue progress event called')
      })
      q.on('idle', (jobId) => {
        t.pass('Queue idle event called')
      })
      q.on('success', (jobId) => {
        t.pass('Queue success event called')
      })
      q.on('failure', (jobId) => {
        t.pass('Queue failure event called')
      })
      q.on('retry', (jobId) => {
        t.pass('Queue retry event called')
      })
      q.on('job failed', (jobId) => {
        console.log('job failed: ' + jobId)
        t.pass('Queue idle event called')
      })


      q.process((job, next) => {
        console.log('~~~~~~~~~~ process ~~~~~~~~~~')
        console.log(job.id)
        setTimeout(() => {
          console.log('~~~~~~~~~~ process finished ~~~~~~~~~~')
          next(null, 'Job Completed')
        }, 3000)
      })

      let jobs = []
      // console.dir(JSON.parse(JSON.stringify(q)))
      // let ej = q.createJob()
      // ej.id = 'ba3002c6-193f-4957-bc13-a4c3871629d7'
      // // jobs.push(ej)
      // for (let i = 0; i < 4; i++) {
        jobs.push(q.createJob({foo: 1}))
      // }

      q.addJob(jobs).then((result) => {
        console.log('~~~~~~~~~~ addJob result ~~~~~~~~~~')
        console.dir(JSON.parse(JSON.stringify(result)))
      }).then(() => {
        return q.summary()
      }).then((d) => {
        console.log('~~~~~~~~~~ summary ~~~~~~~~~~')
        console.dir(d)
      }).then(() => {
        return q.delete(4000)
      }).then((deleteResult) => {
        console.log('~~~~~~~~~~ deleteResult ~~~~~~~~~~')
        console.dir(deleteResult)
      }).catch(err => testError(err, module, t))

      q.jobDefaultOptions = customJobDefaultOptions
      t.deepEqual(q.jobDefaultOptions, customJobDefaultOptions, 'Set default job options')
    })
  })
}
