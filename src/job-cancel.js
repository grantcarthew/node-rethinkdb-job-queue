const logger = require('./logger')(module)
const moment = require('moment')
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function cancel (job, reason) {
  logger('cancel: ' + job.id)
  job.status = enums.jobStatus.cancelled
  job.q.emit(enums.queueStatus.cancelled, job.id)
  job.status = enums.jobStatus.cancelled
  job.dateCancelled = moment().toDate()
  job.progress = 0

  const log = job.createLog(reason, enums.log.information)

  return job.q.r.db(job.q.db).table(job.q.name)
  .get(job.id)
  .update({
    status: job.status,
    progress: job.progress,
    dateCancelled: job.dateFailed,
    log: job.q.r.row('log').append(log),
    queueId: job.q.id
  }, {returnChanges: true})
  .run()
  .then((updateResult) => {
    return dbResult.toJob(job.q, updateResult)
  })
}
