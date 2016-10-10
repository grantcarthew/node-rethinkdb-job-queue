const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const jobAddLog = require('./job-add-log')

module.exports = function jobUpdate (job,
    data = {},
    message = enums.message.jobUpdated,
    type = enums.log.information,
    status = job.status) {
  logger(`jobUpdate:  [${job.id}]`)

  const log = jobAddLog.createLogObject(job, data, message, type, status)
  job.log.push(log)
  const jobCopy = job.getCleanCopy()

  return Promise.resolve().then(() => {
    return job.q.r.db(job.q.db).table(job.q.name)
    .get(job.id)
    .update(jobCopy, {returnChanges: false})
    .run()
  }).then((updateResult) => {
    logger(`updateResult`, updateResult)
    logger(`Event: updated [${job.id}]`)
    job.q.emit(enums.status.updated, job.id)
    return true
  })
}
