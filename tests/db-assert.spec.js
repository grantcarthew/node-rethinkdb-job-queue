const test = require('tape')
const rethinkdbdash = require('rethinkdbdash')
const enums = require('../src/enums')
const dbAssert = require('../src/db-assert')
const testOptions = require('./test-options')
const mockQueue = {
  r: rethinkdbdash(testOptions.connectionOptions),
  db: testOptions.dbName,
  name: testOptions.queueName
}

test('db-assert test', (t) => {
  t.plan(11)
  return dbAssert.database(mockQueue).then((dbResult) => {
    t.ok(dbResult, 'Database asserted')
    return dbAssert.table(mockQueue)
  }).then((tableResult) => {
    t.ok(tableResult, 'Table asserted')
    return dbAssert.index(mockQueue)
  }).then((tableResult) => {
    t.ok(tableResult, 'Indexes asserted')
    return mockQueue.r.dbList().contains(mockQueue.db).run()
  }).then((dbExists) => {
    t.ok(dbExists, 'Database exists')
    return mockQueue.r.tableList().contains(mockQueue.name).run()
  }).then((tableExists) => {
    t.ok(tableExists, 'Table exists')
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
    return mockQueue.r.dbDrop(mockQueue.db).run()
  }).then((dropResult) => {
    t.equals(dropResult.dbs_dropped, 1, 'Unit test db dropped')
    t.equals(dropResult.tables_dropped, 1, 'Unit test table dropped')
    return mockQueue.r.getPoolMaster().drain()
  })
})
