const logger = require('./logger')(module)
const enums = require('./enums')

module.exports.createIndexActiveDateStarted = function (q) {
  logger('createIndexActiveDateStarted')
  let indexName = enums.index.active_dateStarted
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq('active'),
        row('dateStarted'),
        null
      )
    }).run()
  })
}

module.exports.createIndexInactive = function (q) {
  logger('createIndexInactive')
  let indexName = enums.index.inactive
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq('active').or(row('status').eq('completed')),
        null, [
          row('priority'),
          row('dateCreated')
        ]
      )
    }).run()
  })
}

module.exports.createIndexPriorityAndDateCreated = function (q) {
  logger('createIndexPriorityAndDateCreated')
  let indexName = enums.index.priority_dateCreated
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName, [
      q.r.row('priority'),
      q.r.row('dateCreated')
    ]).run()
  })
}

module.exports.createIndexStatus = function (q) {
  logger('createIndexStatus')
  let indexName = enums.index.status
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName).run()
  })
}
