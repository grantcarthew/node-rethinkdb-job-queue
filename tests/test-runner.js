const Promise = require('bluebird')
const testQueue = require('./test-queue')
const testMockQueue = require('./test-mock-queue')
const dbAssertDatabase = require('./db-assert-database.spec')
const dbAssertTable = require('./db-assert-table.spec')
const dbAssertIndex = require('./db-assert-index.spec')
const dbAssert = require('./db-assert.spec')
const enums = require('./enums.spec')
const jobOptions = require('./job-options.spec')
const job = require('./job.spec')
const jobAddLog = require('./job-addlog.spec')
const dbResult = require('./db-result.spec')
const dbQueueAddJob = require('./db-queue-addjob.spec')
const jobCompleted = require('./job-completed.spec')
const jobFailed = require('./job-failed.spec')
const dbReview = require('./db-review.spec')
const dbQueueStatusSummary = require('./db-queue-statussummary.spec')

return dbAssertDatabase().then(() => {
}).then(() => {
  return dbAssertTable()
}).then(() => {
  return dbAssertIndex()
}).then(() => {
  return dbAssert()
}).then(() => {
  // Note: must drain the rethinkdbdash pool or node will not exit gracefully.
  testMockQueue().r.getPoolMaster().drain()
  return Promise.all([
    enums(),
    jobOptions(),
    job(),
    jobAddLog(),
    dbResult(),
    dbQueueAddJob(),
    jobCompleted(),
    jobFailed()
  ])
}).then(() => {
  return dbReview()
}).then(() => {
  return dbQueueStatusSummary()
}).then(() => {
  // Note: must drain the rethinkdbdash pool or node will not exit gracefully.
  testQueue().stop(1)
  return true
})
