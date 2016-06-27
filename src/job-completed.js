const logger = require('./logger')(module)
const moment = require('moment')
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function completed (job, data) {
  logger('completed: ' + job.id)
  job.status = enums.jobStatus.completed
  job.dateCompleted = moment().toDate()
  job.progress = 100
  let duration = moment(job.dateCompleted).diff(moment(job.dateStarted))
  duration = duration >= 0 ? duration : 0

  const log = job.createLog(enums.message.completed)
  log.duration = duration
  log.data = data

  return job.q.r.db(job.q.db).table(job.q.name).get(job.id).update({
    status: job.status,
    dateCompleted: job.dateCompleted,
    progress: job.progress,
    log: job.q.r.row('log').append(log),
    queueId: job.q.id
  }).run().then((updateResult) => {
    job.q.emit(enums.queueStatus.completed, job.id)
    return dbResult.status(job.q, updateResult, 'replaced')
  })
}
