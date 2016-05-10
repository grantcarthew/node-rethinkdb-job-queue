const logger = require('./logger')

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

module.exports.changeFeed = function (r, db, queueName, cb) {
  return r.db(db).table(queueName)
    .changes().run().then((feed) => {
      feed.each(cb)
    })
}

module.exports.deleteTable = function (r, db) {
  return r.dbDrop(db).run()
}
