const logger = require('./logger')(module)
const enums = require('./enums')
const dbChanges = require('./db-changes')

module.exports = function (q, job) {
  if (!job) { return [] }
  let jobs = Array.isArray(job) ? job : [job]
  for (let jobTest of jobs) {
    if (jobTest._committed) {
      return Promise.reject(enums.errors.jobAlreadyCommitted)
    }
    if (!jobTest.id) {
      return Promise.reject(enums.error.jobInvalid)
    }
  }
  logger('addJob', jobs.map(j => j.id))
  jobs = jobs.map((job) => job.cleanCopy)
  return q.r.table(q.name)
  .insert(jobs, {returnChanges: true}).run()
  .then((saveResult) => {
    return dbChanges.toJob(q, saveResult)
  })
}
