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
        row('status').eq('added'),
        [
          row('priority'),
          row('dateRetry'),
          row('dateCreated')
        ],
        row('status').eq('failed'),
        [
          row('priority'),
          row('dateRetry'),
          row('dateCreated')
        ],
        null
      )
    }).run()
  })
}

function createIndexFinishedDateFinished (q) {
  logger('createIndexFinishedDateFinished')
  const indexName = enums.index.indexFinishedDateFinished
  return q.r.db(q.db).table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.db(q.db).table(q.name).indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq('completed'),
        row('dateFinished'),
        row('status').eq('cancelled'),
        row('dateFinished'),
        row('status').eq('terminated'),
        row('dateFinished'),
        null
      )
    }).run()
  })
}

module.exports = function assertIndex (q) {
  logger('assertIndex')
  return Promise.all([
    createIndexActiveDateRetry(q),
    createIndexInactivePriorityDateCreated(q),
    createIndexFinishedDateFinished(q)
  ]).then((indexCreateResult) => {
    logger('Waiting for index...')
    return q.r.db(q.db).table(q.name).indexWait().run()
  }).then(() => {
    logger('Indexes ready.')
    return true
  })
}
