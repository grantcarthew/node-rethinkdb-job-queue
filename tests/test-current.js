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
const jobAddLog = require('./job-add-log.spec')
const dbResult = require('./db-result.spec')
const queueAddJob = require('./queue-add-job.spec')
const queueRemoveJob = require('./queue-remove-job.spec')
const queueGetJob = require('./queue-get-job.spec')
const queueGetNextJob = require('./queue-get-next-job.spec')
const queueReset = require('./queue-reset.spec')
const queueDb = require('./queue-db.spec')
const queueStop = require('./queue-stop.spec')
const queueDelete = require('./queue-delete.spec')
const jobCompleted = require('./job-completed.spec')
const jobFailed = require('./job-failed.spec')
const dbReview = require('./db-review.spec')
const queueStatusSummary = require('./queue-status-summary.spec')

return dbAssertDatabase().then(() => {
}).then(() => {
//   return dbAssertTable()
// }).then(() => {
//   return dbAssertIndex()
// }).then(() => {
//   return dbAssert()
// }).then(() => {
  return Promise.all([
    // enums(),
    // jobOptions(),
    job(),
    // jobAddLog(),
    // queueGetJob(),
    // dbResult(),
    // queueAddJob(),
    // queueRemoveJob(),
    // jobCompleted(),
    // jobFailed()
  ])
}).then(() => {
//   return dbReview()
// }).then(() => {
//   return queueStatusSummary()
// }).then(() => {
//   return queueReset()
// }).then(() => {
//   return queueGetNextJob()
// }).then(() => {
//   return queueDb()
// }).then(() => {
//   return queueStop()
// }).then(() => {
//   return queueDelete()
// }).then(() => {
  // Note: must drain the rethinkdbdash pool or node will not exit gracefully.
  testMockQueue().r.getPoolMaster().drain()
  // TODO: Change below to delete and re-run tests before publishing
  testQueue().stop(100)
  return true
})
