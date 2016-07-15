const logger = require('./logger')(module)
const is = require('./is')
const jobParse = require('./job-parse')
const enums = require('./enums')
const Job = require('./job')
const dbResult = require('./db-result')
const queueProcess = require('./queue-process')

// Following is the list of supported change feed events;
// added
// active
// progress
// completed
// cancelled
// failed
// terminated
// removed

module.exports = function queueChange (q, err, change) {
  logger('queueChange')
  const newVal = change.new_val
  const oldVal = change.old_val
  let queueId = false
  if (newVal && newVal.id) { queueId = newVal.queueId }
  if (!newVal && oldVal && oldVal.queueId) { queueId = oldVal.queueId }

  // console.log('Change queueId: ' + queueId)
  // console.log('Current queueId: ' + q.id)

  // Prevent any change processing if change is caused by this queue
  if (queueId === q.id &&
      !q.testing) {
    // console.log('SKIPPING DUE TO SELF')
    return
  }

  if (err) { throw new Error(err) }
  if (q.testing) {
    console.log('------------- QUEUE CHANGE -------------')
    console.dir(change)
    console.log('----------------------------------------')
  }

  // New job added
  if (is.job(newVal) && !is.job(oldVal)) {
    logger(`Event: added [${newVal.id}]`)
    q.emit(enums.status.added, newVal.id)
    setTimeout(function () {
      queueProcess.restart(q)
    }, Math.floor(Math.random() * 1000))
    return enums.status.added
  }

  // Job active
  if (is.job(newVal) &&
      newVal.status === enums.status.active &&
      is.job(oldVal) &&
      oldVal.status !== enums.status.active) {
    logger(`Event: active [${newVal.id}]`)
    q.emit(enums.status.active, newVal.id)
    return enums.status.active
  }

  // Job completed
  if (is.job(newVal) &&
      newVal.status === enums.status.completed &&
      is.job(oldVal) &&
      oldVal.status !== enums.status.completed) {
    logger(`Event: completed [${newVal.id}]`)
    q.emit(enums.status.completed, newVal.id)
    return enums.status.completed
  }

  // Job removed
  if (!is.job(newVal) && is.job(oldVal)) {
    logger(`Event: removed [${oldVal.id}]`)
    q.emit(enums.status.removed, oldVal.id)
    return enums.status.removed
  }


  console.log('####################################')
}
