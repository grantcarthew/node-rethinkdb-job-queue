const logger = require('./logger')(module)
const is = require('./is')
const enums = require('./enums')

module.exports = function set (job, percent) {
  logger('set: ' + job.id)
  if (!percent || !is.number(percent) || percent < 0) { percent = 0 }
  if (percent > 100) { percent = 100 }

  return job.q.r.db(job.q.db).table(job.q.name).get(job.id).update({
    queueId: job.q.id,
    progress: percent,
    dateRetry: job.q.r.now()
    .add(job.q.r.row('timeout'))
    .add(job.q.r.row('retryDelay').mul(job.q.r.row('retryCount')))
  }).run().then((updateResult) => {
    logger(`Event: progress [${job.id}] [${percent}]`)
    job.q.emit(enums.status.progress, job.id, percent)
    return true
  })
}
