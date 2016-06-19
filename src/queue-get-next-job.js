const logger = require('./logger')(module)
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function (q) {
  logger('getNextJob')
  logger(`Concurrency: ${q.concurrency} Running: ${q.running}`)
  const quantity = q.concurrency - q.running
  return q.r
    .table(q.name)
    .orderBy({index: enums.index.inactive_priority_dateCreated})
    .limit(quantity)
    .update({
      status: enums.jobStatus.active,
      dateStarted: q.r.now(),
      dateRetry: q.r.now().add(q.r.row('retryDelay').mul(q.r.row('retryCount')))
    }, {returnChanges: true})
    .default({})
    .run().then((updateResult) => {
      return dbResult.toJob(q, updateResult)
    })
}
