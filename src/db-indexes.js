const enums = require('./enums')

module.exports.createIndexActive = function (q) {
  let indexName = enums.indexes.active
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
  let indexName = enums.indexes.inactive
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
  let indexName = enums.indexes.priority_dateCreated
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
  let indexName = enums.indexes.status
  return q.r.table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.table(q.name).indexCreate(indexName).run()
  })
}
