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
    logger('resetResult', resetResult)
    return dbResult.status(resetResult, enums.dbResult.deleted)
  }).then((totalRemoved) => {
    logger(`Event: reset [${totalRemoved}]`)
    q.emit(enums.status.reset, totalRemoved)
    return totalRemoved
  })
}
