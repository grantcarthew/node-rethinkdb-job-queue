const Promise = require('bluebird')
const enums = require('./enums.spec')
const is = require('./is.spec')
const datetime = require('./datetime.spec')
const dbDriver = require('./db-driver.spec')
const dbAssertDatabase = require('./db-assert-database.spec')
const dbAssertTable = require('./db-assert-table.spec')
const dbAssertIndex = require('./db-assert-index.spec')
const dbAssert = require('./db-assert.spec')
const dbResult = require('./db-result.spec')
const dbReview = require('./db-review.spec')
const job = require('./job.spec')
const jobOptions = require('./job-options.spec')
const jobParse = require('./job-parse.spec')
const jobProgress = require('./job-progress.spec')
const jobUpdate = require('./job-update.spec')
const jobCompleted = require('./job-completed.spec')
const jobFailed = require('./job-failed.spec')
const jobAddLog = require('./job-add-log.spec')
const queue = require('./queue.spec')
const queueDb = require('./queue-db.spec')
const queueState = require('./queue-state.spec')
const queueAddJob = require('./queue-add-job.spec')
const queueGetJob = require('./queue-get-job.spec')
const queueFindJob = require('./queue-find-job.spec')
const queueGetNextJob = require('./queue-get-next-job.spec')
const queueProcess = require('./queue-process.spec')
const queueChange = require('./queue-change.spec')
const queueInterruption = require('./queue-interruption.spec')
const queueCancelJob = require('./queue-cancel-job.spec')
const queueRemoveJob = require('./queue-remove-job.spec')
const queueReset = require('./queue-reset.spec')
const queueStop = require('./queue-stop.spec')
const queueDrop = require('./queue-drop.spec')
const queueSummary = require('./queue-summary.spec')

return dbAssertDatabase().then(() => {
}).then(() => {
  return dbAssertTable()
}).then(() => {
  return dbAssertIndex()
}).then(() => {
  return dbAssert()
}).then(() => {
  return Promise.all([
    dbDriver(),
    enums(),
    is(),
    datetime(),
    jobOptions(),
    jobParse(),
    job(),
    jobProgress(),
    jobAddLog(),
    jobUpdate(),
    queueGetJob(),
    queueFindJob(),
    dbResult(),
    queueAddJob(),
    queueRemoveJob(),
    jobCompleted(),
    jobFailed()
  ])
}).then(() => {
  return queueInterruption()
}).then(() => {
  return dbReview()
}).then(() => {
  return queueSummary()
}).then(() => {
  return queueReset()
}).then(() => {
  return queueGetNextJob()
}).then(() => {
  return queueCancelJob()
}).then(() => {
  return queueDb()
}).then(() => {
  return queueState()
}).then(() => {
  return queueProcess()
}).then(() => {
  // This test has bee removed for now due to this issue on Tape
  // https://github.com/substack/tape/issues/223
  // To test queueChange, use the test-current.js file by running
  // npm run tc
  // return queueChange()
// }).then(() => {
  return queue()
}).then(() => {
  return queueStop()
}).then(() => {
  return queueDrop()
})
