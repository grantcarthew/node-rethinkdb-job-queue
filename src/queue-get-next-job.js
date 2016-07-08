const logger = require('./logger')(module)
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
  return q.r
    .table(q.name)
    .orderBy({index: enums.index.inactive_priority_dateCreated})
    .limit(quantity)
    .filter(q.r.row('dateRetry').le(q.r.now()))
    .update({
      status: enums.status.active,
      dateStarted: q.r.now(),
      dateRetry: q.r.now()
      .add(q.r.row('timeout'))
      .add(q.r.row('retryDelay').mul(q.r.row('retryCount'))),
      queueId: q.id,
      log: q.r.row('log').append({
        date: q.r.now(),
        queueId: q.id,
        type: enums.log.information,
        status: enums.status.active,
        retryCount: q.r.row('retryCount'),
        message: enums.message.active
      })
    }, {returnChanges: true})
    .default({})
    .run().then((updateResult) => {
      return dbResult.toJob(q, updateResult)
    }).then((updatedJobs) => {
      for (let job of updatedJobs) {
        q.emit(enums.status.active, job)
      }
      return updatedJobs
    })
}
