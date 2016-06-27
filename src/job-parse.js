const logger = require('./logger')(module)
const isUuid = require('isuuid')
const moment = require('moment')
const enums = require('./enums')

module.exports.id = function jobParseId (job) {
  logger('jobParseId', job)
  if (!job) { return [] }
  let jobs = Array.isArray(job) ? job : [job]
  let validIds = []
  for (let j of jobs) {
    if (!isUuid(j) && !isUuid(j.id)) {
      throw new Error(enums.error.idInvalid)
    }
    if (isUuid(j)) {
      validIds.push(j)
    }
    if (isUuid(j.id)) {
      validIds.push(j.id)
    }
  }
  return validIds
}

module.exports.job = function jobParseJob (job) {
  logger('jobParseJob', job)
  if (!job) { return [] }
  let jobs = Array.isArray(job) ? job : [job]
  let validJobs = []
  for (let j of jobs) {
    let detail = false
    if (!isUuid(j.id)) { detail = 'Job id: ' + j.id }
    if (!j.q) { detail = 'Job q missing' }
    if (!j.priority) { detail = 'Job priority missing' }
    if (j.timeout < 0) { detail = 'Job timeout: ' + j.timeout }
    if (j.retryDelay < 0) { detail = 'Job retryDelay: ' + j.retryDelay }
    if (j.retryMax < 0) { detail = 'Job retryMax: ' + j.retryMax }
    if (j.retryCount < 0) { detail = 'Job retryCount: ' + j.retryCount }
    if (!j.status) { detail = 'Job status missing' }
    if (!Array.isArray(j.log)) { detail = 'Job log: ' + j.log }
    if (!moment.isDate(j.dateCreated)) {
      detail = 'Job dateCreated: ' + j.dateCreated
    }
    if (!moment.isDate(j.dateRetry)) {
      detail = 'Job dateRetry: ' + j.dateRetry
    }
    if (j.progress < 0 || j.progress > 100) {
      detail = 'Job progress: ' + j.progress
    }
    if (!j.queueId) { detail = 'Job queueId missing' }
    if (!detail) {
      validJobs.push(j)
    } else {
      throw new Error(enums.error.jobInvalid + ': ' + detail)
    }
  }
  return validJobs
}
