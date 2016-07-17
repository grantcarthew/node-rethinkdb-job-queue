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
// log

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

  // Job added
  if (is.job(newVal) &&
      !is.job(oldVal)) {
    logger(`Event: added [${newVal.id}]`)
    q.emit(enums.status.added, newVal.id)
    setTimeout(function () {
      queueProcess.restart(q)
    }, Math.floor(Math.random() * 1000))
    return enums.status.added
  }

  // Job active
  if (is.active(newVal) &&
      !is.active(oldVal)) {
    logger(`Event: active [${newVal.id}]`)
    q.emit(enums.status.active, newVal.id)
    return enums.status.active
  }

  // Job completed
  if (is.completed(newVal) &&
      !is.completed(oldVal)) {
    logger(`Event: completed [${newVal.id}]`)
    q.emit(enums.status.completed, newVal.id)
    return enums.status.completed
  }

  // Job removed
  if (!is.job(newVal) &&
      is.job(oldVal)) {
    logger(`Event: removed [${oldVal.id}]`)
    q.emit(enums.status.removed, oldVal.id)
    return enums.status.removed
  }

  // Job cancelled
  if (is.cancelled(newVal) &&
      !is.cancelled(oldVal)) {
    logger(`Event: cancelled [${newVal.id}]`)
    q.emit(enums.status.cancelled, newVal.id)
    return enums.status.cancelled
  }

  // Job failed
  if (is.failed(newVal) &&
      !is.failed(oldVal)) {
    logger(`Event: failed [${newVal.id}]`)
    q.emit(enums.status.failed, newVal.id)
    return enums.status.failed
  }

  // Job terminated
  if (is.terminated(newVal) &&
      !is.terminated(oldVal)) {
    logger(`Event: terminated [${newVal.id}]`)
    q.emit(enums.status.terminated, newVal.id)
    return enums.status.terminated
  }

  // Job progress
  if (is.job(newVal) &&
      is.job(oldVal) &&
      newVal.progress !== oldVal.progress) {
    logger(`Event: progress [${newVal.progress}]`)
    q.emit(enums.status.progress, newVal.progress)
    return enums.status.progress
  }

  // Job log
  if (is.active(newVal) &&
      is.active(oldVal) &&
      is.array(newVal.log) &&
      is.array(oldVal.log) &&
      newVal.log.length !== oldVal.log.length) {
    logger(`Event: log`, newVal.log)
    q.emit(enums.status.log, newVal.id)
    return enums.status.log
  }

  console.log('Unknown database change', change)
}
