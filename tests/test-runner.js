const dbAssert = require('./db-assert.spec')
// require('./db-index.spec')
const dbChanges = require('./db-changes.spec')
const dbQueueAddJob = require('./db-queue-addjob.spec')
const dbJobCompleted = require('./db-job-completed.spec')
const dbJobFailed = require('./db-job-failed.spec')
const dbReview = require('./db-review.spec')
const dbQueueStatusSummary = require('./db-queue-statussummary.spec')

return dbAssert().then(() => {
}).then(() => {
  return dbChanges()
}).then(() => {
  return dbQueueAddJob()
}).then(() => {
  return dbJobCompleted()
}).then(() => {
  return dbJobFailed()
}).then(() => {
  return dbReview()
}).then(() => {
  return dbQueueStatusSummary()
}).then(() => {

}).then(() => {

}).then(() => {
  console.log('Tests Completed')
})
