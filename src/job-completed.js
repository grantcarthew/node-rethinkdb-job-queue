const logger = require('./logger')(module)
const moment = require('moment')
const is = require('./is')
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function completed (job, data) {
  logger('completed: ' + job.id)
  job.status = enums.status.completed
  job.dateFinished = moment().toDate()
  job.progress = 100
  let duration = moment(job.dateFinished).diff(moment(job.dateStarted))
  duration = duration >= 0 ? duration : 0

  const log = job.createLog(enums.message.completed)
  log.duration = duration
  log.data = data
  log.retryCount = job.retryCount

  return job.q.r.db(job.q.db).table(job.q.name).get(job.id).update({
    status: job.status,
    dateFinished: job.dateFinished,
    progress: job.progress,
    log: job.q.r.row('log').append(log),
    queueId: job.q.id
  }).run().then((updateResult) => {
    job.q.emit(enums.status.completed, job.id)
    return dbResult.status(job.q, updateResult, enums.dbResult.replaced)
  }).then((replacedValue) => {
    if (is.true(job.q.removeFinishedJobs)) {
      return job.q.removeJob(job).then((deleteResult) => {
        job.q.emit(enums.status.removed, job.id)
        return deleteResult
      })
    } else {
      return replacedValue
    }
  })
}
