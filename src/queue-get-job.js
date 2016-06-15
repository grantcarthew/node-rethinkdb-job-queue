const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbResult = require('./db-result')
const isUuid = require('isuuid')

module.exports = function (q, jobId) {
  logger('getJobById: ', jobId)
  let jobIds = Array.isArray(jobId) ? jobId : [jobId]
  for (let id of jobIds) {
    if (!isUuid(id)) {
      return Promise.reject(enums.error.idInvalid)
    }
  }

  return q.r
    .db(q.db)
    .table(q.name)
    .getAll(...jobIds)
    .run()
    .then((jobsData) => {
      return dbResult.toJob(q, jobsData)
    })
}
