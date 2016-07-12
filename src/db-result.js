const logger = require('./logger')(module)
const Promise = require('bluebird')
const is = require('./is')
const enums = require('./enums')

function getJobsData (dbResult) {
  logger('getJobsData:', dbResult)
  return Promise.resolve().then(() => {
    if (!dbResult) { return [] }
    if (dbResult.errors > 0) {
      const err = new Error(enums.error.dbError)
      err.dbError = dbResult
      return Promise.reject(err)
    }
    if (is.array(dbResult)) {
      return dbResult
    }
    if (is.array(dbResult.changes)) {
      return dbResult.changes.map((change) => {
        return change.new_val
      })
    }
    if (dbResult.new_val) {
      return [dbResult.new_val]
    }
    if (dbResult.id) {
      return [dbResult]
    }
    return []
  })
}

module.exports.toJob = function toJob (q, dbResult) {
  logger('toJob:', dbResult)
  return getJobsData(dbResult).then((jobsData) => {
    return jobsData.map((data) => {
      return q.createJob(null, data)
    })
  })
}

module.exports.toIds = function toIds (q, dbResult) {
  logger('toIds', dbResult)
  return getJobsData(dbResult).then((jobsData) => {
    return jobsData.map((data) => {
      return data.id
    })
  })
}

module.exports.status = function status (q, dbResult, prop) {
  logger('status:', dbResult)
  if (dbResult.errors > 0) {
    return Promise.reject(new Error(dbResult))
  }
  return Promise.resolve(dbResult[prop])
}
