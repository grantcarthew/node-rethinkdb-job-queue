const logger = require('./logger')(module)
const Promise = require('bluebird')
const is = require('./is')
const enums = require('./enums')

function getResultError (dbResult) {
  logger(`getResultError`, dbResult)
  const err = new Error(enums.message.dbError)
  err.dbError = dbResult
  return Promise.reject(err)
}

function getJobsData (dbResult) {
  logger('getJobsData:', dbResult)
  return Promise.resolve().then(() => {
    if (!dbResult) { return [] }
    if (dbResult.errors > 0) {
      return getResultError(dbResult)
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

module.exports.toIds = function toIds (dbResult) {
  logger('toIds', dbResult)
  return getJobsData(dbResult).then((jobsData) => {
    return jobsData.map((data) => {
      return data.id
    })
  })
}

module.exports.status = function status (dbResult, prop) {
  logger('status:', dbResult)
  if (dbResult.errors > 0) {
    return getResultError(dbResult)
  }
  return Promise.resolve(dbResult[prop])
}
