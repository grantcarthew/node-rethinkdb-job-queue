const logger = require('./logger')(module)
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function (q) {
  logger('getNextJob')
  logger(`Concurrency: ${q.concurrency} Running: ${q.running}`)
  let quantity = q.concurrency - q.running
  console.log('Quantity: ' + quantity)
  if (quantity < 1) {
    return Promise.resolve([])
  }
  return q.r
    .table(q.name)
    .orderBy({index: enums.index.inactive_priority_dateCreated})
    .limit(quantity)
    .filter(q.r.row('dateRetry').le(q.r.now()))
    .update({
      status: enums.jobStatus.active,
      dateStarted: q.r.now(),
      dateRetry: q.r.now()
      .add(q.r.row('timeout'))
      .add(q.r.row('retryDelay').mul(q.r.row('retryCount')))
    }, {returnChanges: true})
    .default({})
    .run().then((updateResult) => {
      return dbResult.toJob(q, updateResult)
    })
}
