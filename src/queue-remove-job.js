const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const jobParse = require('./job-parse')
const dbResult = require('./db-result')

module.exports = function removeJob (q, job) {
  logger('removeJob: ' + job)

  return Promise.resolve().then(() => {
    return jobParse.id(job)
  }).then((jobs) => {
    return q.r.db(q.db)
    .table(q.name)
    .getAll(...jobs)
    .delete()
    .run()
  }).then((removeResult) => {
    logger('removeResult', removeResult)
    return dbResult.status(removeResult, enums.dbResult.deleted)
  })
}
