const logger = require('./logger')(module)
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function queueReset (q) {
  logger('reset')
  return q.r.db(q.db)
  .table(q.name)
  .delete()
  .run()
  .then((resetResult) => {
    return dbResult.status(q, resetResult, enums.status.deleted)
  }).then((totalDeleted) => {
    q.emit(enums.status.reset, totalDeleted)
    return totalDeleted
  })
}
