const logger = require('./logger')(module)
const enums = require('./enums')
// TODO: Ensure all indexes are used befor publishing

function createIndexStatus (q) {
  logger('createIndexStatus')
  let indexName = enums.index.status
  return q.r.db(q.db).table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.db(q.db).table(q.name).indexCreate(indexName).run()
  })
}

function createIndexDateRetry (q) {
  logger('createIndexDateRetry')
  let indexName = enums.index.dateRetry
  return q.r.db(q.db).table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.db(q.db).table(q.name).indexCreate(indexName).run()
  })
}

function createIndexPriorityDateCreated (q) {
  logger('createIndexPriorityDateCreated')
  let indexName = enums.index.priority_dateCreated
  return q.r.db(q.db).table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.db(q.db).table(q.name).indexCreate(indexName, [
      q.r.row('priority'),
      q.r.row('dateCreated')
    ]).run()
  })
}

function createIndexActiveDateStarted (q) {
  logger('createIndexActiveDateStarted')
  let indexName = enums.index.active_dateStarted
  return q.r.db(q.db).table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.db(q.db).table(q.name).indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq('active'),
        row('dateStarted'),
        null
      )
    }).run()
  })
}

function createIndexInactivePriorityDateCreated (q) {
  logger('createIndexInactivePriorityDateCreated')
  let indexName = enums.index.inactive_priority_dateCreated
  return q.r.db(q.db).table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.db(q.db).table(q.name).indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq('active'),
        null,
        row('status').eq('completed'),
        null,
        row('status').eq('failed'),
        null, [
          row('priority'),
          row('dateRetry'),
          row('dateCreated')
        ]
      )
    }).run()
  })
}

module.exports = function assertIndex (q) {
  logger('assertIndex')
  return Promise.all([
    createIndexStatus(q),
    createIndexDateRetry(q),
    createIndexPriorityDateCreated(q),
    createIndexActiveDateStarted(q),
    createIndexInactivePriorityDateCreated(q)
  ]).then((indexCreateResult) => {
    logger('Waiting for index...')
    return q.r.db(q.db).table(q.name).indexWait().run()
  }).then(() => {
    logger('Indexes ready.')
    return true
  })
}
