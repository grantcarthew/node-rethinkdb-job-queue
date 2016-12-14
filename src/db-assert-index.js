const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')

function createIndexActiveDateEnable (q) {
  logger('createIndexActiveDateEnable')
  let indexName = enums.index.indexActiveDateEnable
  return Promise.resolve().then(() => {
    return q.r.db(q.db)
    .table(q.name)
    .indexList()
    .contains(indexName)
    .run()
  }).then((exists) => {
    if (exists) {
      return exists
    }
    return q.r.db(q.db)
    .table(q.name)
    .indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq(enums.status.active),
        row('dateEnable'),
        null
      )
    })
    .run()
  })
}

function createIndexInactivePriorityDateCreated (q) {
  logger('createIndexInactivePriorityDateCreated')
  let indexName = enums.index.indexInactivePriorityDateCreated
  return Promise.resolve().then(() => {
    return q.r.db(q.db)
    .table(q.name)
    .indexList()
    .contains(indexName)
    .run()
  }).then((exists) => {
    if (exists) {
      return exists
    }
    return q.r.db(q.db)
    .table(q.name)
    .indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq(enums.status.waiting),
        [
          row('priority'),
          row('dateEnable'),
          row('dateCreated')
        ],
        row('status').eq(enums.status.failed),
        [
          row('priority'),
          row('dateEnable'),
          row('dateCreated')
        ],
        null
      )
    })
    .run()
  })
}

function createIndexFinishedDateFinished (q) {
  logger('createIndexFinishedDateFinished')
  const indexName = enums.index.indexFinishedDateFinished
  return Promise.resolve().then(() => {
    return q.r.db(q.db)
    .table(q.name)
    .indexList()
    .contains(indexName)
    .run()
  }).then((exists) => {
    if (exists) {
      return exists
    }
    return q.r.db(q.db)
    .table(q.name)
    .indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq(enums.status.completed),
        row('dateFinished'),
        row('status').eq(enums.status.cancelled),
        row('dateFinished'),
        row('status').eq(enums.status.terminated),
        row('dateFinished'),
        null
      )
    })
    .run()
  })
}

function createIndexStatus (q) {
  logger('createIndexStatus')
  let indexName = enums.index.indexStatus
  return Promise.resolve().then(() => {
    return q.r.db(q.db)
    .table(q.name)
    .indexList()
    .contains(indexName)
    .run()
  }).then((exists) => {
    if (exists) {
      return exists
    }
    return q.r.db(q.db)
    .table(q.name)
    .indexCreate(indexName)
    .run()
  })
}

module.exports = function assertIndex (q) {
  logger('assertIndex')
  return Promise.all([
    createIndexActiveDateEnable(q),
    createIndexInactivePriorityDateCreated(q),
    createIndexFinishedDateFinished(q),
    createIndexStatus(q)
  ]).then((indexCreateResult) => {
    logger('Waiting for index...')
    return q.r.db(q.db)
    .table(q.name)
    .indexWait()
    .run()
  }).then(() => {
    logger('Indexes ready.')
    return true
  })
}
