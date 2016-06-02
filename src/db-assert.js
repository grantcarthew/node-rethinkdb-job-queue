const logger = require('./logger')(module)
const dbIndexes = require('./db-index')

module.exports.database = function assertDatabase (q) {
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

module.exports.table = function assertTable (q) {
  logger('assertTable')
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
  logger('assertIndex')
  return Promise.all([
    dbIndexes.createIndexStatus(q),
    dbIndexes.createIndexPriorityDateCreated(q),
    dbIndexes.createIndexActiveDateStarted(q),
    dbIndexes.createIndexInactivePriorityDateCreated(q)
  ]).then((indexCreateResult) => {
    return logger('Waiting for index...')
  }).then(() => {
    return q.r.table(q.name).indexWait().run()
  }).then(() => {
    logger('Indexes ready.')
    return true
  })
}
