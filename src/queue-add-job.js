const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const queueProcess = require('./queue-process')
const dbResult = require('./db-result')
const jobParse = require('../src/job-parse')

// skipStatusCheck is for ease of adding jobs during tests
module.exports = function queueAddJob (q, job, skipStatusCheck) {
  logger('addJob', job)
  return Promise.resolve().then(() => {
    return jobParse.job(job)
  }).map((oneJob) => {
    if (!skipStatusCheck && oneJob.status !== enums.jobStatus.created) {
      return Promise.reject(new Error(enums.error.jobAlreadyAdded))
    }
    if (!skipStatusCheck) { oneJob.status = enums.jobStatus.waiting }
    return oneJob.cleanCopy
  }).then((cleanJobs) => {
    return q.r.db(q.db).table(q.name)
    .insert(cleanJobs, {returnChanges: true}).run()
  }).then((saveResult) => {
    queueProcess.restart(q)
    return dbResult.toJob(q, saveResult)
  })
}
