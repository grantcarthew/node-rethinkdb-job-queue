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
      t.plan(3)

      // ---------- Test Setup ----------
      const q = testQueue(testOptions.queueMaster())
      let reviewCount = 0
      function reviewEventHandler (replaceCount) {
        reviewCount++
        // TODO: test count or.....
        console.log(`Review Replaced: ${replaceCount} Event Count: ${reviewCount}`)
      }
      q.on(enums.queueStatus.review, reviewEventHandler)
      function reviewEnabledEventHandler () {
        console.log('Review enabled')
      }
      q.on(enums.queueStatus.reviewEnabled, reviewEnabledEventHandler)
      function reviewDisabledEventHandler () {
        console.log('Review disabled')
      }
      q.on(enums.queueStatus.reviewDisabled, reviewDisabledEventHandler)
      function pausedEventHandler () {
        console.log('Queue Paused')
      }
      q.on(enums.queueStatus.paused, pausedEventHandler)
      function testHandler (job, next) {
        console.dir('Job Started: ' + job.id)
        setTimeout(function () {
          next(null, 'Job Completed: ' + job.id)
        }, 1000)
      }

      // ----------  Test ----------
      const job = q.createJob(testData)
      return q.ready.then(() => {
        q.paused = true
        return q.addJob(job)
      }).then((savedJob) => {
        console.log(q.paused)
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return queueProcess(q, testHandler)
      }).then(() => {
        return queueProcess(q, testHandler).then(() => {
          t.fail('Calling queue-process twice should fail and is not')
        }).catch((err) => {
          t.equal(err.message, enums.error.processTwice, 'Calling queue-process twice returns rejected Promise')
        })
      }).then(() => {
        console.log('Finished !!!!!!!!!!!!!!!!!')
      //   return q.reset()
      // }).then((resetResult) => {
      //   t.ok(resetResult >= 0, 'Queue reset')
      //   resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
