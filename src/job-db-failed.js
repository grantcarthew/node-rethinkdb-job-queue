const logger = require('./logger')(module)
const moment = require('moment')
const enums = require('./enums')
const jobLog = require('./job-log')

module.exports = function completed (err, job, data) {
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
  const duration = moment(job.dateFailed).diff(moment(job.dateStarted))

  const log = jobLog(
    job.dateFailed,
    job.q.id,
    enums.log.error,
    job.status,
    enums.message.failed,
    duration,
    data,
    err
  )
  return job.q.r.table(job.q.name)
  .get(job.id)
  .update({
    status: job.status,
    retryCount: job.retryCount,
    progress: job.probress,
    dateFailed: job.dateFailed,
    log: job.q.r.row('log').add([log])
  }, {returnChanges: true})
  .run()
  .then((updateResult) => {
    if (updateResult.errors > 0) {
      return Promise.reject(updateResult)
    }
    return updateResult.changes
  }).map((change) => {
    return job.q.createJob(null, change.new_val)
  })
}
