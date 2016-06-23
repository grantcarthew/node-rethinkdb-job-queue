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
      t.plan(2)

      // ---------- Test Setup ----------
      const q = testQueue(true, testOptions.queueMaster())
      function reviewEventHandler (replaceCount) {
        console.log('Review: ' + replaceCount)
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
      function testHandler (job, next) {
        console.dir(job)
        next(null, 'testHandler')
      }

      // ----------  Test ----------
      const job = q.createJob(testData)
      //  console.dir(q)
      q.addJob(job).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return queueProcess(q, testHandler)
      }).then(() => {
        console.log('Finished !!!!!!!!!!!!!!!!!');
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
