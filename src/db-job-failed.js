const logger = require('./logger')(module)
const moment = require('moment')
const enums = require('./enums')
const dbChanges = require('./db-changes')

module.exports = function failed (err, job, data) {
  logger('failed: ' + job.id)
  logger('Error', err)
  job.status = enums.jobStatus.failed
  job.q.emit('job failed', job.id)
  if (job.retryCount < job.retryMax) {
    job.status = enums.jobStatus.retry
    job.retryCount++
    job.priority = 1
  }
  job.dateFailed = moment().toDate()
  job.progress = 0
  let duration = moment(job.dateFailed).diff(moment(job.dateStarted))
  duration = duration >= 0 ? duration : 0

  let errMessage = err && err.message ? err.message : err

  const log = {
    logDate: job.dateFailed,
    queueId: job.q.id,
    logType: enums.log.error,
    status: job.status,
    queueMessage: `${enums.message.failed}: ${errMessage}`,
    duration: duration,
    jobData: data
  }
  return job.q.r.db(job.q.db).table(job.q.name)
  .get(job.id)
  .update({
    status: job.status,
    retryCount: job.retryCount,
    progress: job.progress,
    dateFailed: job.dateFailed,
    log: job.q.r.row('log').add([log])
  }, {returnChanges: true})
  .run()
  .then((updateResult) => {
    return dbChanges.toJob(job.q, updateResult)
  })
}
