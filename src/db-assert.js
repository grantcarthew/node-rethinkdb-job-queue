const logger = require('./logger').init(module)
const dbIndexes = require('./db-index')

module.exports.database = function assertDatabase (q) {
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

module.exports.table = function assertTable (q) {
  return q.r.tableList()
  .contains(q.name)
  .do((tableExists) => {
    return q.r.branch(
      tableExists,
      { tables_created: 0 },
      q.r.tableCreate(q.name)
    )
  }).run().then((tableCreateResult) => {
    tableCreateResult.tables_created > 0
      ? logger('Table created: ' + q.name)
      : logger('Table exists: ' + q.name)
  }).then(() => {
    return q.r.table(q.name).wait().run()
  }).then(() => {
    logger('Table ready.')
    return true
  })
}

module.exports.index = function assertIndex (q) {
  return Promise.all([
    dbIndexes.createIndexPriorityAndDateCreated(q),
    dbIndexes.createIndexStatus(q),
    dbIndexes.createIndexActive(q),
    dbIndexes.createIndexInactive(q)
  ]).then((indexCreateResult) => {
    return logger('Waiting for index...')
  }).then(() => {
    return q.r.table(q.name).indexWait().run()
  }).then(() => {
    logger('Indexes ready.')
    return true
  })
}
