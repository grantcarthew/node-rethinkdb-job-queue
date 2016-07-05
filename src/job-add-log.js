const logger = require('./logger')(module)
const enums = require('./enums')

module.exports = function addLog (job, log) {
  logger('addLog', log)
  if (job.status === enums.status.created) {
    return Promise.reject(new Error(enums.error.jobNotAdded))
  }
  return job.q.r.db(job.q.db).table(job.q.name)
  .get(job.id)
  .update({
    log: job.q.r.row('log').append(log),
    queueId: job.q.id
  })
  .then((updateResult) => {
    return updateResult.replaced
  })
}
