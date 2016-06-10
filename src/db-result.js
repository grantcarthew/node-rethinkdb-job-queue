const logger = require('./logger')(module)
const Promise = require('bluebird')

module.exports.toJob = function dbResult (q, dbResult) {
  logger('toJob:', dbResult)
  if (dbResult.errors > 0) {
    return Promise.reject(dbResult)
  }
  if (Array.isArray(dbResult.changes)) {
    return Promise.map(dbResult.changes, (change) => {
      return q.createJob(null, change.new_val)
    })
  } else {
    return Promise.resolve(q.createJob(null, dbResult.new_val))
  }
}
