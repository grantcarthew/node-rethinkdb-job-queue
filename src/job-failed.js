const logger = require('./logger')(module)
const Promise = require('bluebird')
const is = require('./is')
const datetime = require('./datetime')
const enums = require('./enums')
const jobLog = require('./job-log')
const dbResult = require('./db-result')
const serializeError = require('serialize-error')

module.exports = function failed (job, err) {
  logger(`failed:  [${job.id}]`)
  logger(`error`, err)

  let logType = enums.log.error
  const isRetry = job.retryCount < job.retryMax
  const isRepeating = is.repeating(job)
  let dateEnable = new Date()

  job.status = enums.status.terminated

  if (isRetry) {
    job.status = enums.status.failed
    dateEnable = datetime.add.ms(job.retryDelay * job.retryCount)
    job.retryCount++
    logType = enums.log.warning
  }

  if (!isRetry && isRepeating) {
    job.status = enums.status.waiting
    dateEnable = datetime.add.ms(job.repeatDelay)
    job.retryCount = 0
  }

  job.dateFinished = new Date()
  job.progress = 0
  let duration = job.dateFinished - job.dateStarted
  duration = duration >= 0 ? duration : 0

  const errAsString = serializeError(err)

  const logFailed = jobLog.createLogObject(job,
    errAsString,
    enums.message.failed,
    logType,
    job.status)
  logFailed.duration = duration
  logFailed.errorMessage = err && err.message
    ? err.message : enums.message.noErrorMessage
  logFailed.errorStack = err && err.stack
    ? err.stack : enums.message.noErrorStack

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
      retryCount: job.retryCount,
      progress: job.progress,
      dateFinished: job.dateFinished,
      dateEnable,
      log: job.q.r.branch(
        sliceLogs,
        job.q.r.row('log').append(logFailed).append(logTruncated).slice(-job.q.limitJobLogs),
        job.q.r.row('log').append(logFailed)
      ),
      queueId: job.q.id
    }, {returnChanges: true})
    .run(job.q.queryRunOptions)
  }).then((updateResult) => {
    logger(`updateResult`, updateResult)
    return dbResult.toIds(updateResult)
  }).then((jobIds) => {
    if (isRetry || isRepeating) {
      logger(`Event: failed`, job.q.id, jobIds[0])
      job.q.emit(enums.status.failed, job.q.id, jobIds[0])
    } else {
      logger(`Event: terminated`, job.q.id, jobIds[0])
      job.q.emit(enums.status.terminated, job.q.id, jobIds[0])
    }
    if (!isRetry &&
        !isRepeating &&
        is.true(job.q.removeFinishedJobs)) {
      return job.q.removeJob(job).then((deleteResult) => {
        return jobIds
      })
    } else {
      return jobIds
    }
  })
}
