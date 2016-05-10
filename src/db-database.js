const logger = require('./logger')

module.exports.assertDatabase = function (r, db) {
  return r.dbList()
  .contains(db)
  .do((databaseExists) => {
    return r.branch(
      databaseExists,
      { dbs_created: 0 },
      r.dbCreate(db)
    )
  }).run().then((dbCreateResult) => {
    dbCreateResult.dbs_created > 0
      ? logger('Database created: ' + db)
      : logger('Database exists: ' + db)
    return true
  })
}
