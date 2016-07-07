const logger = require('./logger')(module)
const Promise = require('bluebird')
const dbResult = require('./db-result')
const jobParse = require('./job-parse')

module.exports = function queueGetJob (q, jobId) {
  logger('getJobById: ', jobId)
  return Promise.resolve().then(() => {
    return jobParse.id(jobId)
  }).then((ids) => {
    return q.r
      .db(q.db)
      .table(q.name)
      .getAll(...ids)
      .run()
  }).then((jobsData) => {
    return dbResult.toJob(q, jobsData)
  })
}
