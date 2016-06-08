const logger = require('./logger')(module)

module.exports = function assertDatabase (q) {
  logger('assertDatabase')
  return q.r.dbList()
  .contains(q.db)
  .do((databaseExists) => {
    return q.r.branch(
      databaseExists,
      { dbs_created: 0 },
      q.r.dbCreate(q.db)
    )
  }).run().then((dbCreateResult) => {
    dbCreateResult.dbs_created > 0
    ? logger('Database created: ' + q.db)
    : logger('Database exists: ' + q.db)
    return true
  })
}
