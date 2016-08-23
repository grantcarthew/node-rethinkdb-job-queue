const logger = require('./logger')(module)
const Promise = require('bluebird')
const moment = require('moment')
const is = require('./is')
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function failed (err, job) {
  logger(`failed:  [${job.id}]`)
  logger(`error`, err)

  let logType = enums.log.error
  const isRetry = job.retryCount < job.retryMax
  if (isRetry) {
    job.status = enums.status.failed
    job.retryCount++
    logType = enums.log.warning
  } else {
    job.status = enums.status.terminated
  }
  job.dateFinished = moment().toDate()
  job.progress = 0
  let duration = moment(job.dateFinished).diff(moment(job.dateStarted))
  duration = duration >= 0 ? duration : 0

  const errMessage = err && err.message ? err.message : err
  const log = job.createLog(errMessage, logType)
  log.duration = duration
  log.retryCount = job.retryCount

  return Promise.resolve().then(() => {
    return job.q.r.db(job.q.db).table(job.q.name)
    .get(job.id)
    .update({
      status: job.status,
      retryCount: job.retryCount,
      progress: job.progress,
      dateFinished: job.dateFinished,
      log: job.q.r.row('log').append(log),
      queueId: job.q.id
    }, {returnChanges: true})
    .run()
  }).then((updateResult) => {
    logger(`updateResult`, updateResult)
    return dbResult.toIds(updateResult)
  }).then((jobIds) => {
    if (isRetry) {
      logger(`Event: failed [${jobIds[0]}]`)
      job.q.emit(enums.status.failed, jobIds[0])
    } else {
      logger(`Event: terminated [${jobIds[0]}]`)
      job.q.emit(enums.status.terminated, jobIds[0])
    }
    if (!isRetry &&
        is.true(job.q.removeFinishedJobs)) {
      return job.q.removeJob(job).then((deleteResult) => {
        return jobIds
      })
    } else {
      return jobIds
    }
  })
}
