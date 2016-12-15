const logger = require('./logger')(module)
const Promise = require('bluebird')
const is = require('./is')
const enums = require('./enums')
const jobLog = require('./job-log')
const dbResult = require('./db-result')

module.exports = function jobProgress (job, percent) {
  logger('jobProgress: ' + job.id)
  if (!is.active(job)) {
    logger(`Error: progress called on non-active job`, job)
    return Promise.reject(new Error(enums.message.jobNotActive))
  }
  if (!percent || !is.number(percent) || percent < 0) { percent = 0 }
  if (percent > 100) { percent = 100 }

  return Promise.resolve().then(() => {
    return job.q.r.db(job.q.db)
    .table(job.q.name)
    .get(job.id)
    .pluck('progress')
    .run(job.q.queryRunOptions)
  }).then((pluck) => {
    return jobLog.createLogObject(job,
      pluck.progress,
      enums.message.jobProgress,
      enums.log.information)
  }).then((newLog) => {
    return job.q.r.db(job.q.db)
    .table(job.q.name)
    .get(job.id)
    .update({
      queueId: job.q.id,
      progress: percent,
      dateEnable: job.q.r.now()
      .add(
        job.q.r.row('timeout').div(1000)
      )
      .add(
        job.q.r.row('retryDelay').div(1000).mul(job.q.r.row('retryCount')
      )),
      log: job.q.r.row('log').append(newLog)
    }, { returnChanges: true })
    .run(job.q.queryRunOptions)
  }).then((updateResult) => {
    return dbResult.toJob(job.q, updateResult)
  }).then((updateResult) => {
    logger(`Event: progress`, job.q.id, job.id, percent)
    job.q.emit(enums.status.progress, job.q.id, job.id, percent)
    return updateResult[0]
  })
}
