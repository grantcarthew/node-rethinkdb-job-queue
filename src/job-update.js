const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const queueGetJob = require('./queue-get-job')
const jobLog = require('./job-log')

module.exports = function jobUpdate (job) {
  logger(`jobUpdate:  [${job.id}]`)

  const log = jobLog.createLogObject(job,
    null, enums.message.jobUpdated, enums.log.information)

  return Promise.resolve().then(() => {
    return queueGetJob(job.q, job.id)
  }).then((oldJobs) => {
    log.data = oldJobs[0].getCleanCopy()
    delete log.data.log
    job.log.push(log)
    return job.getCleanCopy()
  }).then((cleanJob) => {
    return job.q.r.db(job.q.db).table(job.q.name)
      .get(job.id)
      .update(cleanJob, {returnChanges: false})
      .run()
  }).then((updateResult) => {
    logger(`updateResult`, updateResult)
    logger(`Event: updated [${job.id}]`)
    job.q.emit(enums.status.updated, job.id)
    return true
  })
}
