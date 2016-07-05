const logger = require('./logger')(module)
const moment = require('moment')
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function failed (err, job, data) {
  logger('failed: ' + job.id)
  logger('Error', err)
  job.status = enums.status.failed
  job.q.emit(enums.status.failed, job.id)
  let logType = enums.log.error
  if (job.retryCount < job.retryMax) {
    job.status = enums.status.retry
    job.retryCount++
    job.priority = 1
    logType = enums.log.warning
  }
  job.dateFailed = moment().toDate()
  job.progress = 0
  let duration = moment(job.dateFailed).diff(moment(job.dateStarted))
  duration = duration >= 0 ? duration : 0

  const errMessage = err && err.message ? err.message : err
  const log = job.createLog(errMessage, logType)
  log.duration = duration
  log.data = data
  log.retryCount = job.retryCount

  return job.q.r.db(job.q.db).table(job.q.name)
  .get(job.id)
  .update({
    status: job.status,
    retryCount: job.retryCount,
    progress: job.progress,
    dateFailed: job.dateFailed,
    log: job.q.r.row('log').append(log),
    queueId: job.q.id
  }, {returnChanges: true})
  .run()
  .then((updateResult) => {
    return dbResult.toJob(job.q, updateResult)
  })
}
