const logger = require('./logger')(module)
const moment = require('moment')
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
      dateStarted: q.r.now()
    }, {returnChanges: true})
    .default({})
    .run().then((updateResult) => {
      console.dir(updateResult)
      if (updateResult.changes) {
        return updateResult.changes.map((change) => {
          return q.createJob(null, change.new_val)
        })
      }
      return []
    })
}
