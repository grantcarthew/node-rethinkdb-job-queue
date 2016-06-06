const logger = require('./logger')(module)
const Promise = require('bluebird')

module.exports.toJob = function (q, dbResult) {
  logger('toJob')
  if (dbResult.errors > 0) {
    return Promise.reject(dbResult)
  }
  return Promise.map(dbResult.changes, (change) => {
    return q.createJob(null, change.new_val)
  })
}
