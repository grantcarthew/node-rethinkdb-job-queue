const logger = require('./logger')(module)
const is = require('./is')
const enums = require('./enums')

function ensureArray (job) {
  logger('ensureArray', job)
  if (job == null) { return [] }
  return is.array(job) ? job : [job]
}

module.exports.id = function jobParseId (job) {
  logger('jobParseId', job)
  let jobs = ensureArray(job)
  let validIds = []
  for (let tJob of jobs) {
    if (!is.uuid(tJob) && !is.uuid(tJob.id)) {
      throw new Error(enums.message.idInvalid)
    }
    if (is.uuid(tJob)) {
      validIds.push(tJob)
    }
    if (is.uuid(tJob.id)) {
      validIds.push(tJob.id)
    }
  }
  return validIds
}

function ensureJob (q, job) {
  if (is.job(job)) { return job }
  if (is.number(job) ||
      is.string(job) ||
      is.boolean(job) ||
      is.object(job)) {
    const newJob = q.createJob()
    newJob.data = job
    return newJob
  }
  throw new Error(enums.message.jobInvalid + ': ' + job)
}

module.exports.job = function jobParseJob (q, job) {
  logger('jobParseJob', job)
  let jobs = ensureArray(job)
  let validJobs = []
  for (let eachJob of jobs) {
    let tJob = ensureJob(q, eachJob)
    validJobs.push(tJob)
  }
  return validJobs
}
