const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const is = require('./is')

module.exports = function addLog (job, log) {
  logger('addLog', log)
  let validLog = log
  if (!is.log(log)) {
    if (is.string(log)) {
      validLog = job.createLog(log)
    }
    if (is.object(log)) {
      validLog = job.createLog()
      validLog.data = log
    }
  }
  if (job.status === enums.status.created) {
    return Promise.reject(new Error(enums.message.jobNotAdded))
  }
  return Promise.resolve().then(() => {
    return job.q.r.db(job.q.db).table(job.q.name)
    .get(job.id)
    .update({
      log: job.q.r.row('log').append(validLog),
      queueId: job.q.id
    })
  }).then((updateResult) => {
    job.log.push(validLog)
    logger(`Event: log [${job.id}]`, updateResult)
    job.q.emit(enums.status.log, job.id)
    return true
  })
}
