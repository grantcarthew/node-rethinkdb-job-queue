const logger = require('./logger')(module)
const dbResult = require('./db-result')

module.exports = function (q, jobId) {
  let jobIds = Array.isArray(jobId) ? jobId : [jobId]
  logger('getJobById: ', jobIds)

  return q.r
    .db(q.db)
    .table(q.name)
    .getAll(...jobIds)
    .run()
    .then((jobsData) => {
      return dbResult.toJob(q, jobsData)
    })
}
