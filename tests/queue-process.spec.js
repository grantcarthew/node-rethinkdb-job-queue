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
      t.plan(6)

      // ---------- Test Setup ----------
      const q = testQueue(testOptions.queueMaster())

      let reviewCount = 0
      function reviewEventHandler (replaceCount) {
        reviewCount++
        // TODO: test count or.....
        console.log(`Event: Review [Replaced: ${replaceCount}] [Event Count: ${reviewCount}]`)
      }
      q.on(enums.queueStatus.review, reviewEventHandler)

      function reviewEnabledEventHandler () {
        console.log('Event: Review Enabled')
      }
      q.on(enums.queueStatus.reviewEnabled, reviewEnabledEventHandler)

      function reviewDisabledEventHandler () {
        console.log('Event: Review Disabled')
      }
      q.on(enums.queueStatus.reviewDisabled, reviewDisabledEventHandler)

      function pausedEventHandler () {
        t.pass('Event: Queue paused event raised')
        q.removeListener(enums.queueStatus.paused, pausedEventHandler)
      }
      q.on(enums.queueStatus.paused, pausedEventHandler)

      let readyCount = 0
      function readyEventHandler () {
        readyCount++
        t.pass(`Event: Queue ready event raised [${readyCount}]`)
        //q.removeListener(enums.queueStatus.ready, readyEventHandler)
      }
      q.on(enums.queueStatus.ready, readyEventHandler)

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
        console.log('Finished !!!!!!!!!!!!!!!!!')
      //   return q.reset()
      // }).then((resetResult) => {
      //   t.ok(resetResult >= 0, 'Queue reset')
      //   resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
