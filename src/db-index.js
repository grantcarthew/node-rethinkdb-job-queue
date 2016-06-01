const debug = require('debug')('db-index')
const enums = require('./enums')

module.exports.createIndexActive = function (q) {
  debug('createIndexActive')
  let indexName = enums.index.active
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq('active'),
        row('dateHeartbeat'),
        null
      )
    }).run()
  })
}

module.exports.createIndexInactive = function (q) {
  debug('createIndexInactive')
  let indexName = enums.index.inactive
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq('active'),
        null, [
          row('priority'),
          row('dateCreated')
        ]
      )
    }).run()
  })
}

module.exports.createIndexPriorityAndDateCreated = function (q) {
  debug('createIndexPriorityAndDateCreated')
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
  debug('createIndexStatus')
  let indexName = enums.index.status
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName).run()
  })
}
