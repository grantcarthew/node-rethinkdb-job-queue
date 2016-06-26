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
      t.plan(30)

      // ---------- Test Setup ----------
      const q = testQueue(testOptions.queueMaster())

      let eventTotal = 0
      function eventCount () {
        eventTotal++
        if (eventTotal >= 100) {
          q.removeListener(enums.queueStatus.review, reviewEventHandler)
          q.removeListener(enums.queueStatus.reviewEnabled, reviewEnabledEventHandler)
          q.removeListener(enums.queueStatus.reviewDisabled, reviewDisabledEventHandler)
          q.removeListener(enums.queueStatus.paused, pausedEventHandler)
          q.removeListener(enums.queueStatus.ready, readyEventHandler)
          q.removeListener(enums.queueStatus.processing, processingEventHandler)
          resolve()
        }
      }

      function readyEventHandler () {
        t.pass(`Event: Queue ready [${eventTotal}]`)
        eventCount()
      }
      q.on(enums.queueStatus.ready, readyEventHandler)

      function reviewEventHandler (replaceCount) {
        t.pass(`Event: Review [Replaced: ${replaceCount}] [${eventTotal}]`)
        eventCount()
      }
      q.on(enums.queueStatus.review, reviewEventHandler)

      function reviewEnabledEventHandler () {
        t.pass(`Event: Review enabled [${eventTotal}]`)
        eventCount()
      }
      q.on(enums.queueStatus.reviewEnabled, reviewEnabledEventHandler)

      function reviewDisabledEventHandler () {
        t.pass(`Event: Review disabled [${eventTotal}]`)
        eventCount()
      }
      q.on(enums.queueStatus.reviewDisabled, reviewDisabledEventHandler)

      function pausedEventHandler () {
        t.pass(`Event: Queue paused [${eventTotal}]`)
        eventCount()
      }
      q.on(enums.queueStatus.paused, pausedEventHandler)

      function processingEventHandler (jobId) {
        t.pass(`Event: Queue processing [${jobId}] [${eventTotal}]`)
        eventCount()
      }
      q.on(enums.queueStatus.processing, processingEventHandler)

      function testHandler (job, next) {
        t.pass('Job Started: ' + job.id)
        setTimeout(function () {
          next(null, 'Job Completed: ' + job.id)
        }, 1000)
      }

      // ---------- Processing Test ----------
      const jobs = q.createJob(testData, null, 4)
      return q.ready.then(() => {
        q.paused = true
        return q.addJob(jobs)
      }).then((savedJobs) => {
        t.equal(savedJobs.length, 4, 'Jobs saved successfully')
        return queueProcess.addHandler(q, testHandler)
      }).then(() => {
        return queueProcess.addHandler(q, testHandler).then(() => {
          t.fail('Calling queue-process twice should fail and is not')
        }).catch((err) => {
          t.equal(err.message, enums.error.processTwice, 'Calling queue-process twice returns rejected Promise')
        })
      }).then(() => {
        setTimeout(() => { q.paused = false }, 2000)
        // q.paused = false
      //   return q.reset()
      // }).then((resetResult) => {
      //   t.ok(resetResult >= 0, 'Queue reset')
      //   resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
