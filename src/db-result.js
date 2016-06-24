const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')

module.exports.toJob = function toJob (q, dbResult) {
  logger('toJob:', dbResult)
  if (!dbResult) { return Promise.resolve([]) }
  if (dbResult.errors > 0) {
    const err = new Error(enums.error.dbError)
    err.dbError = dbResult
    return Promise.reject(err)
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
    return Promise.resolve([q.createJob(null, dbResult.new_val)])
  }
  if (dbResult.id) {
    return Promise.resolve([q.createJob(null, dbResult)])
  }
  return []
}

module.exports.status = function status (q, dbResult, prop) {
  logger('status:', dbResult)
  if (dbResult.errors > 0) {
    return Promise.reject(new Error(dbResult))
  }
  return Promise.resolve(dbResult[prop])
}
