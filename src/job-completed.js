const logger = require('./logger')(module)
const Promise = require('bluebird')
const is = require('./is')
const enums = require('./enums')
const jobLog = require('./job-log')
const dbResult = require('./db-result')

module.exports = function completed (job, result) {
  logger(`completed:  [${job.id}]`, result)
  const isRepeating = is.repeating(job)
  job.status = isRepeating ? enums.status.waiting : enums.status.completed
  job.dateFinished = new Date()
  job.progress = isRepeating ? 0 : 100
  let duration = job.dateFinished - job.dateStarted
  duration = duration >= 0 ? duration : 0

  const logCompleted = jobLog.createLogObject(job,
    result, enums.status.completed)
  logCompleted.duration = duration

  const sliceLogs = job.log.length >= job.q.limitJobLogs
  const logTruncated = jobLog.createLogObject(job,
    `Retaining ${job.q.limitJobLogs} log entries`,
    enums.message.jobLogsTruncated,
    enums.log.information,
    job.status)

  return Promise.resolve().then(() => {
    return job.q.r.db(job.q.db)
    .table(job.q.name)
    .get(job.id)
    .update({
      status: job.status,
      dateEnable: job.q.r.branch(
        isRepeating,
        job.q.r.now().add(
          job.q.r.row('repeatDelay').div(1000)
        ),
        job.q.r.row('dateEnable')
      ),
      dateFinished: job.dateFinished,
      progress: job.progress,
      log: job.q.r.branch(
        sliceLogs,
        job.q.r.row('log').append(logCompleted).append(logTruncated).slice(-job.q.limitJobLogs),
        job.q.r.row('log').append(logCompleted)
      ),
      queueId: job.q.id
    }, { returnChanges: true })
    .run(job.q.queryRunOptions)
  }).then((updateResult) => {
    logger(`updateResult`, updateResult)
    return dbResult.toIds(updateResult)
  }).then((jobIds) => {
    logger(`Event: completed`, jobIds[0], isRepeating)
    job.q.emit(enums.status.completed, job.q.id, jobIds[0], isRepeating)
    if (!isRepeating && is.true(job.q.removeFinishedJobs)) {
      return job.q.removeJob(job).then((deleteResult) => {
        return jobIds
      })
    } else {
      return jobIds
    }
  })
}
