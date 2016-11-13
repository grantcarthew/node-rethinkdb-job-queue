const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const queueProcess = require('./queue-process')
const dbResult = require('./db-result')
const jobLog = require('./job-log')
const jobParse = require('./job-parse')

module.exports = function queueAddJob (q, job) {
  logger('addJob', job)
  return Promise.resolve().then(() => {
    return jobParse.job(job)
  }).map((oneJob) => {
    if (oneJob.status === enums.status.created) {
      oneJob.status = enums.status.waiting
    }
    const log = jobLog.createLogObject(oneJob,
      null,
      enums.message.jobAdded,
      enums.log.information,
      enums.status.waiting)
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
    for (let savedjob of savedJobs) {
      logger(`Event: added [${savedjob.id}]`)
      q.emit(enums.status.added, q.id, savedjob.id)
    }
    return savedJobs
  })
}
