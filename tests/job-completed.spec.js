const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const datetime = require('../src/datetime')
const tError = require('./test-error')
const enums = require('../src/enums')
const jobCompleted = require('../src/job-completed')
const tData = require('./test-options').tData
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const eventHandlers = require('./test-event-handlers')
const testName = 'job-completed'

jobCompletedTests()
function jobCompletedTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(142)

      const q = new Queue(tOpts.cxn(), tOpts.default('jobCompleted'))
      let job = q.createJob()
      job.data = tData
      let beforeDate
      let afterDate

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
        removed: 1,
        reset: 1,
        error: 0,
        reviewed: 0,
        detached: 0,
        stopping: 0,
        stopped: 0,
        dropped: 0,
        added: 3,
        waiting: 0,
        active: 0,
        completed: 8,
        cancelled: 0,
        failed: 0,
        terminated: 0,
        reanimated: 0,
        log: 0,
        updated: 5
      }

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')

        // ---------- Job Completed Test ----------
        eventHandlers.add(t, q, state)
        t.comment('job-completed: Job Completed')
        return jobCompleted(savedJob[0], tData)
      }).then((completedIds) => {
        t.equal(completedIds.length, 1, 'Job updated successfully')
        return q.getJob(completedIds)
      }).then((updatedJob) => {
        t.equal(updatedJob[0].status, enums.status.completed, 'Job status is completed')
        t.ok(is.date(updatedJob[0].dateFinished), 'Job dateFinished is a date')
        t.equal(updatedJob[0].progress, 100, 'Job progress is 100')
        t.equal(updatedJob[0].queueId, q.id, 'Job queueId is valid')
        t.equal(updatedJob[0].log.length, 2, 'Job log exists')
        t.ok(is.date(updatedJob[0].log[1].date), 'Log date is a date')
        t.equal(updatedJob[0].log[1].queueId, q.id, 'Log queueId is valid')
        t.equal(updatedJob[0].log[1].type, enums.log.information, 'Log type is information')
        t.equal(updatedJob[0].log[1].status, enums.status.completed, 'Log status is completed')
        t.ok(updatedJob[0].log[1].retryCount >= 0, 'Log retryCount is valid')
        t.ok(updatedJob[0].log[1].message, 'Log message is present')
        t.ok(updatedJob[0].log[1].duration >= 0, 'Log duration is >= 0')
        t.equal(updatedJob[0].log[1].data, tData, 'Log data is valid')

        // ---------- Job Repeat True Test ----------
        t.comment('job-completed: Job Repeat True')
        job = q.createJob().setRepeat(true)
        job.data = tData
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        savedJob[0].processCount = 1
        return savedJob[0].update()
      }).then((updatedJob) => {
        t.ok(is.job(updatedJob), 'Job updated successfully')
        return jobCompleted(updatedJob, tData)
      }).then((completedIds) => {
        t.ok(is.uuid(completedIds[0]), 'Job completed returned job ids')
        return q.getJob(completedIds[0])
      }).then((repeatedJobs) => {
        beforeDate = datetime.add.min(-1)
        afterDate = datetime.add.min(6)
        t.equal(repeatedJobs[0].status, enums.status.waiting, 'Repeat job completed status is waiting')
        t.ok(is.dateBetween(repeatedJobs[0].dateEnable, beforeDate, afterDate), 'Repeat job completed dateEnable is set for five minutes')
        t.ok(is.dateBefore(repeatedJobs[0].dateFinished), 'Repeat job completed dateFinished is before now')
        t.ok(repeatedJobs[0].progress === 0, 'Repeat job completed progress is 0 ')
        t.equal(repeatedJobs[0].processCount, 1, 'Repeat job completed processCount is 1 ')
        t.equal(repeatedJobs[0].log.length, 3, 'Repeat job completed log count is valid')
        let log = repeatedJobs[0].getLastLog()
        t.ok(is.date(log.date), 'Repeat log date is a date')
        t.equal(log.data, tData, 'Repeat log data is valid')
        t.equal(log.message, enums.status.completed, 'Repeat log message is valid')
        t.equal(log.queueId, q.id, 'Repeat log queueId is valid')
        t.equal(log.processCount, 1, 'Repeat log processCount is 1')
        t.equal(log.status, enums.status.waiting, 'Repeat log status is valid')
        t.equal(log.type, enums.log.information, 'Repeat log type is valid')
        repeatedJobs[0].processCount++
        return repeatedJobs[0].update()
      }).then((updatedJob) => {
        t.ok(is.job(updatedJob), 'Job updated successfully')
        return jobCompleted(updatedJob, tData)
      }).then((completedIds) => {
        t.ok(is.uuid(completedIds[0]), 'Job completed returned job ids')
        return q.getJob(completedIds[0])
      }).then((repeatedJobs) => {
        beforeDate = datetime.add.min(-1)
        afterDate = datetime.add.min(6)
        t.equal(repeatedJobs[0].status, enums.status.waiting, 'Repeat job completed status is waiting')
        t.ok(is.dateBetween(repeatedJobs[0].dateEnable, beforeDate, afterDate), 'Repeat job completed dateEnable is set for five minutes')
        t.ok(is.dateBefore(repeatedJobs[0].dateFinished), 'Repeat job completed dateFinished is before now')
        t.ok(repeatedJobs[0].progress === 0, 'Repeat job completed progress is 0 ')
        t.equal(repeatedJobs[0].processCount, 2, 'Repeat job completed processCount is 2 ')
        t.equal(repeatedJobs[0].log.length, 5, 'Repeat job completed log count is valid')
        let log = repeatedJobs[0].getLastLog()
        t.ok(is.date(log.date), 'Repeat log date is a date')
        t.equal(log.data, tData, 'Repeat log data is valid')
        t.equal(log.message, enums.status.completed, 'Repeat log message is valid')
        t.equal(log.queueId, q.id, 'Repeat log queueId is valid')
        t.equal(log.processCount, 2, 'Repeat log processCount is 2')
        t.equal(log.status, enums.status.waiting, 'Repeat log status is valid')
        t.equal(log.type, enums.log.information, 'Repeat log type is valid')

        // ---------- Job Limit Logs Test ----------
        t.comment('job-completed: Limit Logs')
        repeatedJobs[0].setRepeat(false)
        job.q._limitJobLogs = 3
        t.equal(repeatedJobs[0].log.length, 5, 'Job has 5 log entries prior to log limiting')
        return jobCompleted(repeatedJobs[0])
      }).then((limitLogsIds) => {
        t.ok(is.uuid(limitLogsIds[0]), 'Job completed returns uuid')
        return q.getJob(limitLogsIds[0])
      }).then((limitLogsJobs) => {
        t.equal(limitLogsJobs[0].log.length, 3, 'Job has 3 log entries after log limiting')
        // have to loop through the logs because the timestamp is the same
        // for the completed and truncated entries. Job.getLastLog() is indeterminate
        let logValid = false
        function setLogValid () { logValid = true }
        for (let log of limitLogsJobs[0].log) {
          log.message === enums.message.jobLogsTruncated && setLogValid()
        }
        t.ok(logValid, 'Job has logs truncated log entry')

        job.q._limitJobLogs = 1000
        // ---------- Job Repeat Number Test ----------
        t.comment('job-completed: Job Repeat Number')
        job = q.createJob().setRepeat(2)
        job.data = tData
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        savedJob[0].processCount++
        return savedJob[0].update()
      }).then((updatedJob) => {
        t.ok(is.job(updatedJob), 'Job updated successfully')
        return jobCompleted(updatedJob, tData)
      }).then((completedIds) => {
        t.ok(is.uuid(completedIds[0]), 'Job completed returned job ids')
        return q.getJob(completedIds[0])
      }).then((repeatedJobs) => {
        beforeDate = datetime.add.min(-1)
        afterDate = datetime.add.min(6)
        t.equal(repeatedJobs[0].status, enums.status.waiting, 'Repeat job completed status is waiting')
        t.ok(is.dateBetween(repeatedJobs[0].dateEnable, beforeDate, afterDate), 'Repeat job completed dateEnable is set for five minutes')
        t.ok(is.dateBefore(repeatedJobs[0].dateFinished), 'Repeat job completed dateFinished is before now')
        t.ok(repeatedJobs[0].progress === 0, 'Repeat job completed progress is 0 ')
        t.equal(repeatedJobs[0].processCount, 1, 'Repeat job completed processCount is 1 ')
        t.equal(repeatedJobs[0].log.length, 3, 'Repeat job completed log count is valid')
        let log = repeatedJobs[0].getLastLog()
        t.ok(is.date(log.date), 'Repeat log date is a date')
        t.equal(log.data, tData, 'Repeat log data is valid')
        t.equal(log.message, enums.status.completed, 'Repeat log message is valid')
        t.equal(log.queueId, q.id, 'Repeat log queueId is valid')
        t.equal(log.processCount, 1, 'Repeat log processCount is 1')
        t.equal(log.status, enums.status.waiting, 'Repeat log status is valid')
        t.equal(log.type, enums.log.information, 'Repeat log type is valid')
        repeatedJobs[0].processCount++
        return repeatedJobs[0].update()
      }).then((updatedJob) => {
        t.ok(is.job(updatedJob), 'Job updated successfully')
        return jobCompleted(updatedJob, tData)
      }).then((completedIds) => {
        t.ok(is.uuid(completedIds[0]), 'Job completed returned job ids')
        return q.getJob(completedIds[0])
      }).then((repeatedJobs) => {
        beforeDate = datetime.add.min(-1)
        afterDate = datetime.add.min(6)
        t.equal(repeatedJobs[0].status, enums.status.waiting, 'Repeat job completed status is waiting')
        t.ok(is.dateBetween(repeatedJobs[0].dateEnable, beforeDate, afterDate), 'Repeat job completed dateEnable is set for five minutes')
        t.ok(is.dateBefore(repeatedJobs[0].dateFinished), 'Repeat job completed dateFinished is before now')
        t.ok(repeatedJobs[0].progress === 0, 'Repeat job completed progress is 0 ')
        t.equal(repeatedJobs[0].processCount, 2, 'Repeat job completed processCount is 2 ')
        t.equal(repeatedJobs[0].log.length, 5, 'Repeat job completed log count is valid')
        let log = repeatedJobs[0].getLastLog()
        t.ok(is.date(log.date), 'Repeat log date is a date')
        t.equal(log.data, tData, 'Repeat log data is valid')
        t.equal(log.message, enums.status.completed, 'Repeat log message is valid')
        t.equal(log.queueId, q.id, 'Repeat log queueId is valid')
        t.equal(log.processCount, 2, 'Repeat log processCount is 2')
        t.equal(log.status, enums.status.waiting, 'Repeat log status is valid')
        t.equal(log.type, enums.log.information, 'Repeat log type is valid')
        repeatedJobs[0].processCount++
        return repeatedJobs[0].update()
      }).then((updatedJob) => {
        t.ok(is.job(updatedJob), 'Job updated successfully')
        return jobCompleted(updatedJob, tData)
      }).then((completedIds) => {
        t.ok(is.uuid(completedIds[0]), 'Job completed returned job ids')
        return q.getJob(completedIds[0])
      }).then((repeatedJobs) => {
        beforeDate = datetime.add.min(-1)
        afterDate = datetime.add.min(6)
        t.equal(repeatedJobs[0].status, enums.status.completed, 'Repeat job completed status is completed')
        t.ok(is.dateBetween(repeatedJobs[0].dateEnable, beforeDate, afterDate), 'Repeat job completed dateEnable is set for five minutes')
        t.ok(is.dateBefore(repeatedJobs[0].dateFinished), 'Repeat job completed dateFinished is before now')
        t.ok(repeatedJobs[0].progress === 100, 'Repeat job completed progress is 100 ')
        t.equal(repeatedJobs[0].processCount, 3, 'Repeat job completed processCount is 3 ')
        t.equal(repeatedJobs[0].log.length, 7, 'Repeat job completed log count is valid')
        let log = repeatedJobs[0].getLastLog()
        t.ok(is.date(log.date), 'Repeat log date is a date')
        t.equal(log.data, tData, 'Repeat log data is valid')
        t.equal(log.message, enums.status.completed, 'Repeat log message is valid')
        t.equal(log.queueId, q.id, 'Repeat log queueId is valid')
        t.equal(log.processCount, 3, 'Repeat log processCount is 3')
        t.equal(log.status, enums.status.completed, 'Repeat log status is valid')
        t.equal(log.type, enums.log.information, 'Repeat log type is valid')

        // ---------- Job Completed with Remove Test ----------
        t.comment('job-completed: Job Completed with Remove')
        job = q.createJob()
        job.data = tData
        return q.addJob(job)
      }).then((savedJob) => {
        t.equal(savedJob[0].id, job.id, 'Job saved successfully')
        q._removeFinishedJobs = true
        return jobCompleted(savedJob[0], tData)
      }).then((removedIds) => {
        t.equal(removedIds.length, 1, 'Job removed successfully')
        return q.getJob(removedIds[0])
      }).then((exist) => {
        t.equal(exist.length, 0, 'Job not in database')
        return q.reset()
      }).then((resetResult) => {
        t.ok(resetResult >= 0, 'Queue reset')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)
        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
