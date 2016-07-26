const logger = require('./logger')(module)
const Promise = require('bluebird')

module.exports = function assertDatabase (q) {
  logger('assertDatabase')
  return Promise.resolve().then(() => {
    return q.r.dbList()
      .contains(q.db)
      .do((databaseExists) => {
        return q.r.branch(
          databaseExists,
          { dbs_created: 0 },
          q.r.dbCreate(q.db)
        )
      })
      .run()
  }).then((dbCreateResult) => {
    dbCreateResult.dbs_created > 0
    ? logger('Database created: ' + q.db)
    : logger('Database exists: ' + q.db)
    return true
  })
}
