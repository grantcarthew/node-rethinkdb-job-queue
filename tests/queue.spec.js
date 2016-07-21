const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const enums = require('../src/enums')
const is = require('../src/is')
const testError = require('./test-error')
const testOptions = require('./test-options')
const connectionOptionsOnly = testOptions.connection()
const queueDefaultOptions = testOptions.queueDefault()
const customjobOptions = testOptions.jobOptionsHigh()
const testData = require('./test-options').testData
const Queue = require('../src/queue')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue', (t) => {
      t.plan(600)

      let q = new Queue()
      q.ready.then((ready) => {
        t.ok(ready, 'Queue is ready')

        // ---------- Constructor Tests ----------
        t.comment('queue: Constructor')
        t.ok(q, 'Queue created with default options')
        t.equal(q.name, enums.options.name, 'Default queue name valid')
        t.equal(q.host, enums.options.host, 'Default host name is valid')
        t.equal(q.port, enums.options.port, 'Default port is valid')
        t.equal(q.db, enums.options.db, 'Default db name is valid')
        t.ok(q.master, 'Queue is master queue')
        t.equal(q.masterInterval, enums.options.masterInterval, 'Queue masterInterval is valid')
        t.notOk(q.paused, 'Queue is not paused')
        t.equal(q.running, 0, 'Running jobs is zero')
        t.ok(q.changeFeed, 'Queue change feed is enabled')
        t.ok(q.idle, 'Queue is idle')
        t.ok(is.function(q.connection), 'Queue connection valid')
        t.ok(is.object(q.jobOptions), 'Queue jobOptions is an object')
        t.equal(q.jobOptions.priority, enums.priorityFromValue(40), 'Default job priority is normal')
        t.equal(q.jobOptions.timeout, enums.options.timeout, 'Default job timeout is valid')
        t.equal(q.jobOptions.retryMax, enums.options.retryMax, 'Default job retryMax is valid')
        t.equal(q.jobOptions.retryDelay, enums.options.retryDelay, 'Default job retryDelay is valid')
        console.log(q)

      })

      // q.on('ready', () => {
      //   t.pass('Event: Queue ready')
      // })
      // q.on('added', (job) => {
      //   t.pass('Queue added event called')
      // })
      // q.on('processing', (processingValue) => {
      //   t.pass('Queue processing event called')
      // })
      // q.on('progress', (progressValue) => {
      //   t.pass('Queue progress event called')
      // })
      // q.on('idle', (jobId) => {
      //   t.pass('Queue idle event called')
      // })
      // q.on('success', (jobId) => {
      //   t.pass('Queue success event called')
      // })
      // q.on('failed', (jobId) => {
      //   t.pass('Queue failure event called')
      // })
      // // q.on('retry', (jobId) => {
      // //   t.pass('Queue retry event called')
      // // })
      // q.on('job failed', (jobId) => {
      //   console.log('job failed: ' + jobId)
      //   t.pass('Queue idle event called')
      // })
      //
      //
      // q.process((job, next) => {
      //   console.log('~~~~~~~~~~ process ~~~~~~~~~~')
      //   console.log(job.id)
      //   setTimeout(() => {
      //     console.log('~~~~~~~~~~ process finished ~~~~~~~~~~')
      //     next(null, 'Job Completed')
      //   }, 3000)
      // })
      //
      // let jobs = []
      // // console.dir(JSON.parse(JSON.stringify(q)))
      // // let ej = q.createJob()
      // // ej.id = 'ba3002c6-193f-4957-bc13-a4c3871629d7'
      // // // jobs.push(ej)
      // // for (let i = 0; i < 4; i++) {
      //   jobs.push(q.createJob({foo: 1}))
      // // }
      //
      // q.addJob(jobs).then((result) => {
      //   console.log('~~~~~~~~~~ addJob result ~~~~~~~~~~')
      //   console.dir(JSON.parse(JSON.stringify(result)))
      // }).then(() => {
      //   return q.summary()
      // }).then((d) => {
      //   console.log('~~~~~~~~~~ summary ~~~~~~~~~~')
      //   console.dir(d)
      // }).then(() => {
      //   return q.drop(4000)
      // }).then((removeResult) => {
      //   console.log('~~~~~~~~~~ removeResult ~~~~~~~~~~')
      //   console.dir(removeResult)
      // }).catch(err => testError(err, module, t))
      //
      // q.jobOptions = customjobOptions
      // t.deepEqual(q.jobOptions, customjobOptions, 'Set default job options')
    })
  })
}
