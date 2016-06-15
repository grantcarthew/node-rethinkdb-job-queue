const logger = require('./logger')(module)
const enums = require('./enums')
const dbResult = require('./db-result')

// skipStatusCheck is for ease of adding jobs during tests
module.exports = function queueAddJob (q, job, skipStatusCheck) {
  if (!job) { return [] }
  let jobs = Array.isArray(job) ? job : [job]
  logger('addJob', jobs.length)
  for (let valid of jobs) {
    if (!valid.id) {
      return Promise.reject(enums.error.jobInvalid)
    }
    if (!skipStatusCheck && valid.status !== enums.jobStatus.created) {
      return Promise.reject(enums.error.jobAlreadyAdded)
    }
  }
  jobs = jobs.map((jobPrep) => {
    if (!skipStatusCheck) { jobPrep.status = enums.jobStatus.waiting }
    return jobPrep.cleanCopy
  })

  return q.r.db(q.db).table(q.name)
  .insert(jobs, {returnChanges: true}).run()
  .then((saveResult) => {
    return dbResult.toJob(q, saveResult)
  })
}
