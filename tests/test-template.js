const test = require('tape')
const Promise = require('bluebird')
// const moment = require('moment')
const enums = require('../src/enums')
// const is = require('../src/is')
const tError = require('./test-error')
const tData = require('./test-options').tData
const tOpts = require('./test-options')
const Queue = require('../src/queue')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('XXXXXXXX', (t) => {
      t.plan(2)

      const q = new Queue(tOpts.cxn(), tOpts.default())
      const job = q.createJob()

      // ---------- Event Handler Setup ----------
      let testEvents = false
      function completedEventHandler (jobId) {
        if (testEvents) {
          t.equal(jobId, job.id, `Event: Job completed [${jobId}]`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.completed, completedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.completed, completedEventHandler)
      }

      q.addJob(job).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        addEventHandlers()

        // ---------- First Test ----------

        removeEventHandlers()
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
