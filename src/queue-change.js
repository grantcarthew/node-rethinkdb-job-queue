const logger = require('./logger')(module)
const is = require('./is')
const util = require('util')
const enums = require('./enums')
const queueProcess = require('./queue-process')

// Following is the list of supported change feed events;
// added
// log
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
  if (is.job(newVal)) { queueId = newVal.queueId }
  if (!is.job(newVal) && is.job(oldVal)) { queueId = oldVal.queueId }
  if (!queueId) {
    logger(`Change feed and queueId missing`, change)
    return
  }

  // Prevent any change processing if change is caused by this queue
  if (queueId === q.id &&
      !q.testing) {
    logger('Change feed by self, skipping events')
    return
  }

  if (err) { throw new Error(err) }

  if (q.testing) {
    logger('------------- QUEUE CHANGE -------------')
    logger(util.inspect(change, {colors: true}))
    logger('----------------------------------------')
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
    q.emit(enums.status.progress, newVal.id, newVal.progress)
    return enums.status.progress
  }

  // Job log
  if (is.job(newVal) &&
      is.job(oldVal) &&
      is.array(newVal.log) &&
      is.array(oldVal.log) &&
      newVal.log.length > oldVal.log.length) {
    logger(`Event: log`, newVal.log)
    q.emit(enums.status.log, newVal.id)
    return enums.status.log
  }

  // TODO: change this to logger
  console.log('Unknown database change', change)
}
