const logger = require('./logger')
const enums = require('./enums')

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

function createIndexInactive (q) {
  let indexName = enums.indexes.inactive
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName, function (row) {
      return q.r.branch(row('status').eq('active'), null, [
        row('priority'),
        row('dateCreated')
      ]).run()
    })
  })
}

function createIndexPriorityAndDateCreated (q) {
  let indexName = enums.indexes.priority_dateCreated
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName, [
      q.r.row('priority'),
      q.r.row('dateCreated')
    ]).run()
  })
}

function createIndexStatus (q) {
  let indexName = enums.indexes.status
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName).run()
  })
}

module.exports.index = function assertIndex (q) {
  return Promise.all([
    createIndexPriorityAndDateCreated(q),
    createIndexStatus(q),
    createIndexInactive(q)
  ]).then((indexCreateResult) => {
    return logger('Waiting for indexes...')
  }).then(() => {
    return q.r.table(q.name).indexWait().run()
  }).then(() => {
    logger('Indexes ready.')
    return true
  })
}
