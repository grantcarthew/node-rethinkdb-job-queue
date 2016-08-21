const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const queueProcess = require('./queue-process')
const dbResult = require('./db-result')
const jobParse = require('./job-parse')

// skipStatusCheck is for ease of adding jobs during tests
module.exports = function queueAddJob (q, job, skipStatusCheck) {
  logger('addJob', job)
  return Promise.resolve().then(() => {
    return jobParse.job(job)
  }).map((oneJob) => {
    if (!skipStatusCheck && oneJob.status !== enums.status.created) {
      return Promise.reject(new Error(enums.message.jobAlreadyAdded))
    }
    if (!skipStatusCheck) { oneJob.status = enums.status.added }
    const log = oneJob.createLog(
      enums.message.jobAdded,
      enums.log.information,
      enums.status.added)
    oneJob.log.push(log)
    return oneJob.getCleanCopy()
  }).then((cleanJobs) => {
    logger(`cleanJobs`, cleanJobs)
    return q.r.db(q.db).table(q.name)
    .insert(cleanJobs, {returnChanges: true}).run()
  }).then((saveResult) => {
    logger(`saveResult`, saveResult)
    queueProcess.restart(q)
    return dbResult.toJob(q, saveResult)
  }).then((savedJobs) => {
    for (let job of savedJobs) {
      logger(`Event: added [${job.id}]`)
      q.emit(enums.status.added, job.id)
    }
    return savedJobs
  })
}
