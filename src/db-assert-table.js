const logger = require('./logger')(module)
const Promise = require('bluebird')

module.exports = function assertTable (q) {
  logger('assertTable')
  return Promise.resolve().then(() => {
    return q.r.db(q.db)
      .tableList()
      .contains(q.name)
      .do((tableExists) => {
        return q.r.branch(
          tableExists,
          { tables_created: 0 },
          q.r.db(q.db).tableCreate(q.name)
        )
      })
      .run()
  }).then((tableCreateResult) => {
    tableCreateResult.tables_created > 0
      ? logger('Table created: ' + q.name)
      : logger('Table exists: ' + q.name)
  }).then(() => {
    return q.r.db(q.db).table(q.name).wait().run()
  }).then(() => {
    logger('Table ready.')
    return true
  })
}
