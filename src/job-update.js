const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const queueGetJob = require('./queue-get-job')
const jobLog = require('./job-log')

module.exports = function jobUpdate (job) {
  logger(`jobUpdate:  [${job.id}]`)

  return Promise.resolve().then(() => {
    return queueGetJob(job.q, job.id)
  }).then((oldJobs) => {
    let oldJobCopy = oldJobs[0].getCleanCopy()
    delete oldJobCopy.log
    let log = jobLog.createLogObject(job,
      oldJobCopy,
      enums.message.jobUpdated,
      enums.log.information)
    job.log.push(log)
    return job.getCleanCopy()
  }).then((cleanJob) => {
    return job.q.r.db(job.q.db)
    .table(job.q.name)
    .get(job.id)
    .update(
      cleanJob,
      {returnChanges: false}
    )
    .run(job.q.queryRunOptions)
  }).then((updateResult) => {
    logger(`updateResult`, updateResult)
    logger(`Event: updated`, job.q.id, job.id)
    job.q.emit(enums.status.updated, job.q.id, job.id)
    return job
  })
}
