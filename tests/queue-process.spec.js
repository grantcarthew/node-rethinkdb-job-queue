const test = require('tape')
const Promise = require('bluebird')
const enums = require('../src/enums')
const testError = require('./test-error')
const testQueue = require('./test-queue')
const testOptions = require('./test-options')
const testData = require('./test-options').testData
const queueProcess = require('../src/queue-process')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-process test', (t) => {
      t.plan(40)

      // ---------- Test Setup ----------
      const q = testQueue(testOptions.queueMaster())
      q.on(enums.queueStatus.ready, function ready () {
        eventCount('Queue ready')
      })

      let eventTotal = 0
      const eventMax = 40
      const noOfJobsToCreate = 1000
      const jobDelay = 100

      function eventCount (eventMessage) {
        eventTotal++

        if (eventTotal < eventMax) {
          t.pass(`Event: ${eventMessage} [${eventTotal}]`)
        }
        if (eventTotal >= eventMax) {
          Object.keys(enums.queueStatus).forEach((n) => {
            q.listeners(n).forEach((f) => q.removeListener(n, f))
          })
          resolve()
        }
      }

      function addEvents () {
        q.on(enums.queueStatus.review, function review (replaceCount) {
          eventCount(`Review [Replaced: ${replaceCount}]`)
        })
        q.on(enums.queueStatus.reviewEnabled, function reviewEnabled () {
          eventCount('Review enabled')
        })
        q.on(enums.queueStatus.reviewDisabled, function reviewDisabled () {
          eventCount('Review disabled')
        })
        q.on(enums.queueStatus.paused, function paused () {
          eventCount('Queue paused')
        })
        q.on(enums.queueStatus.resumed, function resumed () {
          eventCount('Queue resumed')
        })
        q.on(enums.queueStatus.processing, function processing (jobId) {
          eventCount(`Queue processing [${jobId}]`)
        })
        q.on(enums.queueStatus.completed, function completed (jobId) {
          eventCount(`Queue completed [${jobId}]`)
        })
      }

      function testHandler (job, next) {
        t.pass('Job Started: ' + job.id)
        setTimeout(function () {
          next(null, 'Job Completed: ' + job.id)
        }, jobDelay)
      }

      // ---------- Processing Test ----------
      const jobs = q.createJob(testData, null, noOfJobsToCreate)
      return q.ready.then(() => {
        addEvents()
        q.paused = true
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, noOfJobsToCreate, 'Jobs saved successfully')
        return queueProcess.addHandler(q, testHandler)
      }).then(() => {
        t.equal(q.running, 0, 'Queue not processing jobs')
        return queueProcess.addHandler(q, testHandler).then(() => {
          t.fail('Calling queue-process twice should fail and is not')
        }).catch((err) => {
          t.equal(err.message, enums.error.processTwice, 'Calling queue-process twice returns rejected Promise')
        })
      }).delay(jobDelay / 2).then(() => {
        q.paused = false
      }).delay(jobDelay / 2).then(() => {
        t.equal(q.running, q.concurrency, 'Queue is processing max concurrent jobs')
        // q.paused = false
      //   return q.reset()
      // }).then((resetResult) => {
      //   t.ok(resetResult >= 0, 'Queue reset')
      //   resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
