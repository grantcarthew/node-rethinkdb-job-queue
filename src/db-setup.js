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

module.exports.assertTable = function (r, db, queueName) {
  return r.db(db).tableList()
  .contains(queueName)
  .do((tableExists) => {
    return r.branch(
      tableExists,
      { tables_created: 0 },
      r.db(db)
        .tableCreate(queueName)
    )
  }).run().then((tableCreateResult) => {
    tableCreateResult.tables_created > 0
      ? logger('Table created: ' + queueName)
      : logger('Table exists: ' + queueName)
    return true
  })
}

module.exports.queueChangeFeed = function (r, db, queueName, cb) {
  return r.db(db).table(queueName)
    .changes().run().then((feed) => {
      feed.each(cb)
    })
}
