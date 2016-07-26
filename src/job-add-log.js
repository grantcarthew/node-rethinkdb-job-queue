const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function addLog (job, log) {
  logger('addLog', log)
  if (job.status === enums.status.created) {
    return Promise.reject(new Error(enums.message.jobNotAdded))
  }
  return Promise.resolve().then(() => {
    return job.q.r.db(job.q.db).table(job.q.name)
    .get(job.id)
    .update({
      log: job.q.r.row('log').append(log),
      queueId: job.q.id
    })
  }).then((updateResult) => {
    logger(`Event: log [${job.id}]`, updateResult)
    job.q.emit(enums.status.log, job.id)
    return dbResult.status(updateResult, enums.dbResult.replaced)
  })
}
