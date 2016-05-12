const logger = require('./logger')
const dbQueue = require('./db-queue')

function assertDatabase (q) {
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

function assertTable (q) {
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

function assertIndex (q) {
  let indexName = q.enums.indexes.priorityAndDateCreated
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName, [
      q.r.row('priority'),
      q.r.row('dateCreated')
    ]).run()
  }).then((indexCreateResult) => {
    indexCreateResult.created > 0
      ? logger('Index created: ' + indexName)
      : logger('Index exists: ' + indexName)
  }).then(() => {
    return q.r.table(q.name).indexWait().run()
  }).then(() => {
    logger('Indexes ready.')
    return true
  })
}

// Ensures the database and table specified exists.
// Also registers change feed on the queue table.
module.exports = function (q) {
  // return this.assertDbPromise.then((dbAsserted) => {
  //   if (dbAsserted) {
  //     return undefined
  //   }

    return assertDatabase(q).then(() => {
      return assertTable(q)
    }).then(() => {
      return assertIndex(q)
    }).then(() => {
      return q.isWorker ? dbQueue.registerQueueChangeFeed() : true
    })
  //   return this.assertDbPromise
  // })
}
