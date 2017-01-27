const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function queueGetNextJob (q) {
  logger('getNextJob')
  logger(`Concurrency: [${q.concurrency}] Running: [${q.running}]`)
  let quantity = q.concurrency - q.running
  logger(`Query Limit: [${quantity}]`)
  if (quantity < 1) {
    return Promise.resolve([])
  }
  return Promise.resolve().then(() => {
    return q.r
    .table(q.name)
    .orderBy({index: enums.index.indexInactivePriorityDateCreated})
    .limit(quantity)
    .filter(
      q.r.row('dateEnable').le(q.r.now())
    )
    .update(getJobUpdate(q), {returnChanges: true})
    .default({})
    .run(q.queryRunOptions)
  }).then((updateResult) => {
    logger('updateResult', updateResult)
    return dbResult.toJob(q, updateResult)
  }).then((updatedJobs) => {
    for (let job of updatedJobs) {
      logger(`Event: active [${job.id}]`)
      q.emit(enums.status.active, q.id, job.id)
    }
    return updatedJobs
  })
}

function getJobUpdate (q) {
  return function (job) {
    return q.r.branch(
      job('status').ne(enums.status.active),
      {
        status: enums.status.active,
        dateStarted: q.r.now(),
        dateEnable: q.r.now()
        .add(
          job('timeout').div(1000)
        )
        .add(
          job('retryDelay').div(1000).mul(job('retryCount'))
        ),
        queueId: q.id,
        processCount: job('processCount').add(1),
        log: job('log').append({
          date: q.r.now(),
          queueId: q.id,
          type: enums.log.information,
          status: enums.status.active,
          retryCount: job('retryCount'),
          processCount: job('processCount'),
          message: enums.message.active
        })
      },
      null
    )
  }
}
