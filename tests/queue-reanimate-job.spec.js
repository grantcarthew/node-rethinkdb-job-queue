const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const enums = require('../src/enums')
const tError = require('./test-error')
const tOpts = require('./test-options')
const queueReanimateJob = require('../src/queue-reanimate-job')
const Queue = require('../src/queue')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-reanimate'

queueReanimateJobTests()
function queueReanimateJobTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(49)

      // ---------- Test Setup ----------
      const q = new Queue(tOpts.cxn(), tOpts.default('queueReanimateJob'))

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 0,
        progress: 0,
        pausing: 0,
        paused: 0,
        resumed: 0,
        removed: 0,
        idle: 0,
        reset: 0,
        error: 0,
        reviewed: 0,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 1,
        waiting: 0,
        active: 0,
        completed: 0,
        cancelled: 1,
        failed: 0,
        terminated: 0,
        reanimated: 1,
        log: 0,
        updated: 1
      }

      // ---------- Test Setup ----------
      let job = q.createJob()
      let dateEnable
      let newDateEnable = new Date()
      newDateEnable.setDate(newDateEnable.getDate() + 5)

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.pause()
      }).then(() => {
        eventHandlers.add(t, q, state)

        // ---------- Reanimate Job Tests ----------
        t.comment('queue-reanimate-job: Reanimate Cancelled Job')
        return q.addJob(job)
      }).then((result) => {
        t.equal(result.length, 1, `Job saved successfully`)
        return q.getJob(job.id)
      }).then((result) => {
        dateEnable = result[0].dateEnable.toString()
        result[0].progress = 50
        result[0].retryCount = 2
        return result[0].update()
      }).then((result) => {
        return q.cancelJob(job.id)
      }).then((result) => {
        return q.getJob(job.id)
      }).then((result) => {
        t.equal(result[0].dateEnable.toString(), dateEnable, 'Job dateEnable is valid')
        t.equal(result[0].log.length, 3, 'Job log is valid')
        t.equal(result[0].progress, 50, 'Job progress valid')
        t.equal(result[0].queueId, q.id, 'Job queueId is valid')
        t.equal(result[0].retryCount, 2, 'Job retryCount valid')
        t.equal(result[0].status, enums.status.cancelled, 'Job is cancelled')
        return queueReanimateJob(q, job.id, newDateEnable)
      }).then((result) => {
        t.ok(is.uuid(result[0]), 'Reanimate jobs returns job ids')
        return q.getJob(job.id)
      }).then((result) => {
        t.equal(result[0].dateEnable.toString(), newDateEnable.toString(), 'Job reanimate dateEnable is valid')
        t.equal(result[0].log.length, 4, 'Job reanimate log is valid')
        t.equal(result[0].progress, 0, 'Job reanimate progress valid')
        t.equal(result[0].queueId, q.id, 'Job reanimate queueId is valid')
        t.equal(result[0].retryCount, 0, 'Job reanimate retryCount valid')
        t.equal(result[0].status, enums.status.waiting, 'Job reanimate is waiting')
        let lastLog = result[0].getLastLog()
        t.ok(is.date(lastLog.date), 'Job reanimate log date is valid')
        t.equal(lastLog.message, enums.message.jobReanimated, 'Job reanimate log message is valid')
        t.equal(lastLog.queueId, q.id, 'Job reanimate log queueId is valid')
        t.equal(lastLog.retryCount, 0, 'Job reanimate log retryCount is valid')
        t.equal(lastLog.status, enums.status.waiting, 'Job reanimate log status is valid')
        t.equal(lastLog.type, enums.log.information, 'Job reanimate log type is valid')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)

        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
