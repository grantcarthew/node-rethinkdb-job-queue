const test = require('tape')
const rethinkdbdash = require('rethinkdbdash')
const enums = require('../src/enums')
const dbIndex = require('../src/db-index')
const testOptions = require('./test-options')
const mockQueue = {
  r: rethinkdbdash(testOptions.connectionOptions),
  db: testOptions.dbName,
  name: testOptions.queueName
}

test('db-index test', (t) => {
  t.plan(9)

  return mockQueue.r.table(mockQueue.name).indexList().run()
  .each((existingIndex) => {
    return mockQueue.r.table(mockQueue.name).indexDrop(existingIndex)
  }).then((removed) => {
    t.equal(removed.length, 4, 'Existing indexes dropped')
    return dbIndex.createIndexStatus(mockQueue)
  }).then((index1) => {
    t.ok(index1, 'status index asserted')
    return dbIndex.createIndexPriorityDateCreated(mockQueue)
  }).then((index2) => {
    t.ok(index2, 'priority_dateCreated index asserted')
    return dbIndex.createIndexActiveDateStarted(mockQueue)
  }).then((index3) => {
    t.ok(index3, 'active_dateStarted index asserted')
    return dbIndex.createIndexInactivePriorityDateCreated(mockQueue)
  }).then((index3) => {
    t.ok(index3, 'inactive_priority_dateCreated index asserted')
    return mockQueue.r.table(mockQueue.name)
    .indexList().run()
  }).then((indexes) => {
    t.ok(indexes.includes(enums.index.status),
      'status index exists')
    t.ok(indexes.includes(enums.index.priority_dateCreated),
      'priority_dateCreated index exists')
    t.ok(indexes.includes(enums.index.active_dateStarted),
      'active_dateStarted index exists')
    t.ok(indexes.includes(enums.index.inactive_priority_dateCreated),
      'inactive_priority_dateCreated index exists')
  })
})
