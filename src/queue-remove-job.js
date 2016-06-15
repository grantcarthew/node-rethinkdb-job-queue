const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbResult = require('./db-result')
const isUuid = require('isuuid')

module.exports = function removeJob (q, job) {
  if (!job) { return [] }
  let jobs = Array.isArray(job) ? job : [job]
  logger('removeJob: ' + jobs.length)
  if (!isUuid(jobs[0]) && !isUuid(jobs[0].id)) {
    return Promise.reject(enums.error.idInvalid)
  }

  if (isUuid(jobs[0].id)) {
    jobs = jobs.map(j => j.id)
  }

  return q.r.db(q.db)
  .table(q.name)
  .getAll(...jobs)
  .delete()
  .run()
  .then((deleteResult) => {
    return dbResult.status(q, deleteResult, 'deleted')
  })
}
