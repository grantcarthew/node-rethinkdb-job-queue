const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const jobParse = require('./job-parse')
const dbResult = require('./db-result')

module.exports = function removeJob (q, job) {
  logger('removeJob: ' + job)

  return Promise.resolve().then(() => {
    return jobParse.id(job)
  }).then((jobIds) => {
    return Promise.props({
      jobIds,
      removeResult: q.r.db(q.db)
      .table(q.name)
      .getAll(...jobIds)
      .delete()
      .run()
    })
  }).then((result) => {
    for (let id of result.jobIds) {
      logger(`Event: removed [${id}]`)
      q.emit(enums.status.removed, id)
    }
    return dbResult.status(result.removeResult, enums.dbResult.deleted)
  })
}
