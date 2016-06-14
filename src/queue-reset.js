const logger = require('./logger')(module)
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function (q) {
  logger('reset')
  return q.r.db(q.db)
  .table(q.name)
  .delete()
  .run()
  .then((resetResult) => {
    return dbResult.status(q, resetResult, enums.jobStatus.deleted)
  }).then((totalDeleted) => {
    q.emit(enums.queueStatus.reset, totalDeleted)
    return totalDeleted
  })
}
