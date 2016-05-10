const logger = require('./logger')

module.exports.assertDatabase = function (r, dbName) {
  return r.dbList()
  .contains(dbName)
  .do((databaseExists) => {
    return r.branch(
      databaseExists,
      { dbs_created: 0 },
      r.dbCreate(dbName)
    )
  }).run().then((dbCreateResult) => {
    dbCreateResult.dbs_created > 0
      ? logger('Database created: ' + dbName)
      : logger('Database exists: ' + dbName)
    return true
  })
}

module.exports.assertTable = function (r, dbName, tableName) {
  return r.db(dbName).tableList()
  .contains(tableName)
  .do((tableExists) => {
    return r.branch(
      tableExists,
      { tables_created: 0 },
      r.db(dbName)
        .tableCreate(tableName)
    )
  }).run().then((tableCreateResult) => {
    tableCreateResult.tables_created > 0
      ? logger('Table created: ' + tableName)
      : logger('Table exists: ' + tableName)
    return true
  })
}

module.exports.queueChangeFeed = function (r, dbName, tableName, cb) {
  return r.db(dbName).table(tableName)
    .changes().run().then((feed) => {
      feed.each(cb)
    })
}
