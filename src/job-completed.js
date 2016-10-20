const logger = require('./logger')(module)
const Promise = require('bluebird')
const is = require('./is')
const enums = require('./enums')
const jobLog = require('./job-log')
const dbResult = require('./db-result')

module.exports = function completed (job, result) {
  logger(`completed:  [${job.id}]`, result)
  job.status = enums.status.completed
  job.dateFinished = new Date()
  job.progress = 100
  let duration = job.dateFinished - job.dateStarted
  duration = duration >= 0 ? duration : 0

  const log = jobLog.createLogObject(job, result, enums.message.completed)
  log.duration = duration

  return Promise.resolve().then(() => {
    return job.q.r.db(job.q.db).table(job.q.name)
    .get(job.id)
    .update({
      status: job.status,
      dateFinished: job.dateFinished,
      progress: job.progress,
      log: job.q.r.row('log').append(log),
      queueId: job.q.id
    }, { returnChanges: true })
    .run()
  }).then((updateResult) => {
    logger(`updateResult`, updateResult)
    return dbResult.toIds(updateResult)
  }).then((jobIds) => {
    logger(`Event: completed [${jobIds[0]}]`)
    job.q.emit(enums.status.completed, jobIds[0])
    if (is.true(job.q.removeFinishedJobs)) {
      return job.q.removeJob(job).then((deleteResult) => {
        return jobIds
      })
    } else {
      return jobIds
    }
  })
}
