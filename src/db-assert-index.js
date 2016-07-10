const logger = require('./logger')(module)
const enums = require('./enums')

function createIndexActiveDateRetry (q) {
  logger('createIndexActiveDateRetry')
  let indexName = enums.index.indexActiveDateRetry
  return q.r.db(q.db).table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.db(q.db).table(q.name).indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq('active'),
        row('dateRetry'),
        null
      )
    }).run()
  })
}

function createIndexInactivePriorityDateCreated (q) {
  logger('createIndexInactivePriorityDateCreated')
  let indexName = enums.index.indexInactivePriorityDateCreated
  return q.r.db(q.db).table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.db(q.db).table(q.name).indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq('active'),
        null,
        row('status').eq('completed'),
        null,
        row('status').eq('cancelled'),
        null,
        row('status').eq('terminated'),
        null, [
          row('priority'),
          row('dateRetry'),
          row('dateCreated')
        ]
      )
    }).run()
  })
}

// function createIndex

module.exports = function assertIndex (q) {
  logger('assertIndex')
  return Promise.all([
    createIndexActiveDateRetry(q),
    createIndexInactivePriorityDateCreated(q)
  ]).then((indexCreateResult) => {
    logger('Waiting for index...')
    return q.r.db(q.db).table(q.name).indexWait().run()
  }).then(() => {
    logger('Indexes ready.')
    return true
  })
}
