const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')

function createIndexActiveDateEnable (q) {
  logger('createIndexActiveDateEnable')
  const indexName = enums.index.indexActiveDateEnable
  return Promise.resolve().then(() => {
    return q.r.db(q.db)
    .table(q.name)
    .indexList()
    .contains(indexName)
    .run(q.queryRunOptions)
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
    .run(q.queryRunOptions)
  })
}

function createIndexInactivePriorityDateCreated (q) {
  logger('createIndexInactivePriorityDateCreated')
  const indexName = enums.index.indexInactivePriorityDateCreated
  return Promise.resolve().then(() => {
    return q.r.db(q.db)
    .table(q.name)
    .indexList()
    .contains(indexName)
    .run(q.queryRunOptions)
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
    .run(q.queryRunOptions)
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
    .run(q.queryRunOptions)
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
    .run(q.queryRunOptions)
  })
}

function createIndexName (q) {
  logger('createIndexName')
  const indexName = enums.index.indexName
  return Promise.resolve().then(() => {
    return q.r.db(q.db)
    .table(q.name)
    .indexList()
    .contains(indexName)
    .run(q.queryRunOptions)
  }).then((exists) => {
    if (exists) {
      return exists
    }
    return q.r.db(q.db)
    .table(q.name)
    .indexCreate(indexName)
    .run(q.queryRunOptions)
  })
}

function createIndexStatus (q) {
  logger('createIndexStatus')
  const indexName = enums.index.indexStatus
  return Promise.resolve().then(() => {
    return q.r.db(q.db)
    .table(q.name)
    .indexList()
    .contains(indexName)
    .run(q.queryRunOptions)
  }).then((exists) => {
    if (exists) {
      return exists
    }
    return q.r.db(q.db)
    .table(q.name)
    .indexCreate(indexName)
    .run(q.queryRunOptions)
  })
}

function createIndexDateCreated (q) {
  logger('createIndexDateCreated')
  const indexName = enums.index.indexDateCreated
  return Promise.resolve().then(() => {
    return q.r.db(q.db)
    .table(q.name)
    .indexList()
    .contains(indexName)
    .run(q.queryRunOptions)
  }).then((exists) => {
    if (exists) {
      return exists
    }
    return q.r.db(q.db)
    .table(q.name)
    .indexCreate(indexName)
    .run(q.queryRunOptions)
  })
}

module.exports = function assertIndex (q) {
  logger('assertIndex')
  return Promise.all([
    createIndexActiveDateEnable(q),
    createIndexInactivePriorityDateCreated(q),
    createIndexFinishedDateFinished(q),
    createIndexName(q),
    createIndexStatus(q),
    createIndexDateCreated(q)
  ]).then((indexCreateResult) => {
    logger('Waiting for index...')
    return q.r.db(q.db)
    .table(q.name)
    .indexWait()
    .run(q.queryRunOptions)
  }).then(() => {
    logger('Indexes ready.')
    return true
  })
}
