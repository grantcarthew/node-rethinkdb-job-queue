const test = require('tap').test
const Promise = require('bluebird')
const datetime = require('../src/datetime')
const is = require('../src/is')
const tError = require('./test-error')
const enums = require('../src/enums')
const jobProgress = require('../src/job-progress')
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'job-progress'

jobProgressTests()
function jobProgressTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(47)

      const q = new Queue(tOpts.cxn(), tOpts.default('jobProgress'))
      const job = q.createJob()
      job.timeout = enums.options.timeout
      job.retryDelay = enums.options.retryDelay
      job.retryCount = 0

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 0,
        progress: 6,
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
        added: 0,
        waiting: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
        terminated: 0,
        reanimated: 0,
        log: 0,
        updated: 0
      }

      let tempDateEnable = job.dateEnable
      return q.addJob(job).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        eventHandlers.add(t, q, state)
        savedJob[0].retryCount = 1
        savedJob[0].status = enums.status.active
        return jobProgress(savedJob[0])
      }).then((updatedJob) => {
        t.ok(is.job(updatedJob), 'Job updated successfully')
        return job.q.r.db(job.q.db).table(job.q.name).get(job.id).update({
          retryCount: 1
        }).run()
      }).then(() => {
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 0, 'Job progress is 0 when updated with a null value')
        t.ok(
          is.dateBetween(updatedJob[0].dateEnable,
            tempDateEnable,
            datetime.add.ms(new Date(), updatedJob[0].timeout + 2000)),
          'Job dateEnable updated successfully'
        )
        updatedJob[0].status = enums.status.active
        return jobProgress(updatedJob[0], -10)
      }).then((updatedJob) => {
        t.ok(is.job(updatedJob), 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 0, 'Job progress is 0 when updated with negative value')
        t.ok(
          is.dateBetween(updatedJob[0].dateEnable,
            tempDateEnable,
            datetime.add.ms(new Date(), updatedJob[0].timeout + 2000 + updatedJob[0].retryDelay)),
          'Job dateEnable updated successfully'
        )
        updatedJob[0].status = enums.status.active
        return jobProgress(updatedJob[0], 1)
      }).then((updatedJob) => {
        t.ok(is.job(updatedJob), 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 1, 'Job progress is 1 percent')
        updatedJob[0].status = enums.status.active
        return jobProgress(updatedJob[0], 50)
      }).then((updatedJob) => {
        t.ok(is.job(updatedJob), 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 50, 'Job progress is 50 percent')
        updatedJob[0].status = enums.status.active
        return jobProgress(updatedJob[0], 100)
      }).then((updatedJob) => {
        t.ok(is.job(updatedJob), 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 100, 'Job progress is 100 percent')
        t.equal(updatedJob[0].getLastLog().data, 50, 'Job progress log contains old percent')
        updatedJob[0].status = enums.status.active
        return jobProgress(updatedJob[0], 101)
      }).then((updatedJob) => {
        t.ok(is.job(updatedJob), 'Job updated successfully')
        return q.getJob(job.id)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].progress, 100, 'Job progress is 100 when updated with larger value')
        updatedJob[0].status = enums.status.failed
        return jobProgress(updatedJob[0], 101).catch((err) => {
          t.ok(is.error(err), 'Inactive job rejects Promise')
        })
      }).then(() => {
        //
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
