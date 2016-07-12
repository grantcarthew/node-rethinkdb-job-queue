const logger = require('./logger')(module)
const moment = require('moment')
const is = require('./is')
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function failed (err, job, data) {
  logger('failed: ' + job.id)
  logger('Error', err)

  let logType = enums.log.error
  if (job.retryCount < job.retryMax) {
    job.status = enums.status.failed
    job.q.emit(enums.status.failed, job.id, job.dateRetry)
    job.retryCount++
    job.priority = 1
    logType = enums.log.warning
  } else {
    job.status = enums.status.terminated
    job.q.emit(enums.status.terminated, job.id)
  }
  job.dateFinished = moment().toDate()
  job.progress = 0
  let duration = moment(job.dateFinished).diff(moment(job.dateStarted))
  duration = duration >= 0 ? duration : 0

  const errMessage = err && err.message ? err.message : err
  const log = job.createLog(errMessage, logType)
  log.duration = duration
  log.data = data
  log.retryCount = job.retryCount

  if (job.status === enums.status.terminated &&
      is.boolean(job.q.removeFinishedJobs) &&
      job.q.removeFinishedJobs === true) {
    return job.q.removeJob(job).then((deleteResult) => {
      job.q.emit(enums.status.removed, job.id)
      return deleteResult
    })
  } else {
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
    .then((updateResult) => {
      return dbResult.toJob(job.q, updateResult)
    })
  }
}
