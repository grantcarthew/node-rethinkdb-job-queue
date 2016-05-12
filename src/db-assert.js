const logger = require('./logger')

module.exports.database = function (q) {
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

module.exports.table = function (q) {
  return q.r.db(q.db).tableList()
  .contains(q.name)
  .do((tableExists) => {
    return q.r.branch(
      tableExists,
      { tables_created: 0 },
      q.r.db(q.db)
        .tableCreate(q.name)
    )
  }).run().then((tableCreateResult) => {
    tableCreateResult.tables_created > 0
      ? logger('Table created: ' + q.name)
      : logger('Table exists: ' + q.name)
    return true
  })
}
