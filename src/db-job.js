const logger = require('./logger')(module)
const Promise = require('bluebird')
const moment = require('moment')
const enums = require('./enums')
const jobLog = require('./job-log')

module.exports.completed = function (job, data) {
  logger('completed')
  job.status = enums.jobStatus.completed
  job.dateCompleted = moment().toDate()
  job.progress = 100
  const duration = moment(job.dateCompleted).diff(moment(job.dateStarted))

  const log = jobLog(
    job.dateCompleted,
    job.q.id,
    enums.log.type.information,
    job.status,
    enums.messages.completed,
    duration,
    data
  )
  return job.q.r.table(job.q.name).get(job.id).update({
    status: job.status,
    dateCompleted: job.dateCompleted,
    progress: job.progress,
    log: job.q.r.row('log').add([log])
  }).run()
}

module.exports.failed = function (err, job, data) {
  logger('failed')
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
    enums.log.type.error,
    job.status,
    enums.messages.failed,
    duration,
    data,
    err
  )
  return job.q.r.table(job.q.name).get(job.id).update({
    status: job.status,
    retryCount: job.retryCount,
    progress: job.probress,
    dateFailed: job.dateFailed,
    log: job.q.r.row('log').add([log])
  }).run()
}
