const logger = require('./logger')(module)
const Promise = require('bluebird')

module.exports.toJob = function toJob (q, dbResult) {
  logger('toJob:', dbResult)
  if (dbResult.errors > 0) {
    return Promise.reject(dbResult)
  }
  if (Array.isArray(dbResult)) {
    return Promise.map(dbResult, jobData => q.createJob(null, jobData))
  }
  if (Array.isArray(dbResult.changes)) {
    return Promise.map(dbResult.changes, (change) => {
      return q.createJob(null, change.new_val)
    })
  }
  if (dbResult.new_val) {
    return Promise.resolve(q.createJob(null, dbResult.new_val))
  }
  if (dbResult.id) {
    return Promise.resolve(q.createJob(null, dbResult))
  }
}

module.exports.status = function status (q, dbResult, prop) {
  logger('status:', dbResult)
  if (dbResult.errors > 0) {
    return Promise.reject(dbResult)
  }
  return Promise.resolve(dbResult[prop])
}
