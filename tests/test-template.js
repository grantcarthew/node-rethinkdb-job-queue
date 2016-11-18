// const test = require('tap').test
// const Promise = require('bluebird')
// const datetime = require('../src/datetime')
// const is = require('../src/is')
// const enums = require('../src/enums')
// const tError = require('./test-error')
// const tOpts = require('./test-options')
// const tData = require('./test-options').tData
// const queueProcess = require('../src/queue-process')
// const dbReview = require('../src/db-review')
// const Queue = require('../src/queue')
// const eventHandlers = require('./test-event-handlers')
// const testName = 'XXXXXXXXXXXX'
//
// module.exports = function () {
//   return new Promise((resolve, reject) => {
//     test(testName, (t) => {
//       t.plan(1000)
//
//       // ---------- Test Setup ----------
//       const q = new Queue(tOpts.cxn(), tOpts.default())
//
//       let jobs
//       let jobDelay = 200
//       const noOfJobsToCreate = 10
//
//       // ---------- Event Handler Setup ----------
//       let state = {
//         testName,
//         enabled: false,
//         ready: 0,
//         processing: 0,
//         progress: 0,
//         pausing: 0,
//         paused: 0,
//         resumed: 0,
//         removed: 0,
//         reset: 0,
//         error: 0,
//         reviewed: 0,
//         detached: 0,
//         stopping: 0,
//         stopped: 0,
//         dropped: 0,
//         added: 0,
//         waiting: 0,
//         active: 0,
//         completed: 0,
//         cancelled: 0,
//         failed: 0,
//         terminated: 0,
//         reanimated: 0,
//         log: 0,
//         updated: 0
//       }
//
//       // ---------- Test Setup ----------
//       jobs = []
//       for (let i = 0; i < noOfJobsToCreate; i++) {
//         jobs.push(q.createJob())
//       }
//       return q.reset().then((resetResult) => {
//         t.ok(is.integer(resetResult), 'Queue reset')
//         return q.pause()
//       }).then(() => {
//         eventHandlers.add(t, q, state)
//
//         // ---------- Processing, Pause, and Concurrency Test ----------
//         t.comment('queue-process: Process, Pause, and Concurrency')
//         return q.addJob(jobs)
//       }).then((savedJobs) => {
//         t.equal(savedJobs.length, noOfJobsToCreate, `Jobs saved successfully: [${savedJobs.length}]`)
//
//         // ---------- Queue Summary ----------
//         t.comment('queue-process: Queue Summary')
//         return q.summary()
//       }).then((queueSummary) => {
//
//         // ---------- Event Summary ----------
//         eventHandlers.remove(t, q, state)
//
//         return q.reset()
//       }).then((resetResult) => {
//         t.ok(resetResult >= 0, 'Queue reset')
//         q.stop()
//         return resolve(t.end())
//       }).catch(err => tError(err, module, t))
//     })
//   })
// }
