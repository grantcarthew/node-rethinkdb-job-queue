const logger = require('./logger')(module)
const is = require('./is')
const util = require('util')
const enums = require('./enums')
const queueProcess = require('./queue-process')
const queueInterruption = require('./queue-interruption')

// Following is the list of supported change feed events;
// paused - Global event
// resumed - Global event
// reviewed - Global event
// added
// active
// progress
// completed
// cancelled
// failed
// terminated
// removed
// log

function restartProcessing (q) {
  logger('restartProcessing')
  setTimeout(function randomRestart () {
    queueProcess.restart(q)
  }, Math.floor(Math.random() * 1000))
}

module.exports = function queueChange (q, err, change = {}) {
  logger('queueChange', change)

  const newVal = change.new_val
  const oldVal = change.old_val

  let queueId = false
  if (newVal && newVal.queueId) { queueId = newVal.queueId }
  if (!newVal && oldVal && oldVal.queueId) { queueId = oldVal.queueId }
  if (!queueId) {
    logger(`Change feed and queueId missing`, change)
    return
  }

  // Prevent any change processing if change is caused by this queue
  if (queueId === q.id) {
    logger('Change feed by self, skipping events')
    return
  }

  if (err) { throw new Error(err) }

  logger('------------- QUEUE CHANGE -------------')
  logger(util.inspect(change, {colors: true}))
  logger(queueId)
  logger('----------------------------------------')

  // Queue global state change
  if (!newVal && oldVal && oldVal.id && oldVal.id === enums.state.docId) {
    // Ignoring state document deletion.
    return enums.status.active
  }
  if (newVal && newVal.id && newVal.id === enums.state.docId) {
    logger('State document changed')
    if (newVal && newVal.state) {
      if (newVal.state === enums.status.paused) {
        logger('Global queue state paused')
        return queueInterruption.pause(q, enums.state.global)
      }
      if (newVal.state === enums.status.active) {
        logger('Global queue state active')
        return queueInterruption.resume(q, enums.state.global)
      }
      if (newVal.state === enums.status.reviewed) {
        logger('Global queue state reviewed')
        logger(`Event: reviewed [local: false]`)
        q.emit(enums.status.reviewed, newVal.queueId, {
          local: false,
          reviewed: null,
          removed: null
        })
        if (q.running < q.concurrency) {
          return restartProcessing(q)
        }
        return enums.status.reviewed
      }
    }
    const err = new Error(enums.message.globalStateError)
    logger('Event: State document change error', err, q.id)
    q.emit(enums.status.error, q.id, err)
    return enums.status.error
  }

  // Job added
  if (is.job(newVal) &&
      !is.job(oldVal)) {
    logger(`Event: added [${newVal.id}]`)
    q.emit(enums.status.added, newVal.queueId, newVal.id)
    restartProcessing(q)
    return enums.status.added
  }

  // Job active
  if (is.active(newVal) &&
      !is.active(oldVal)) {
    logger(`Event: active [${newVal.id}]`)
    q.emit(enums.status.active, newVal.queueId, newVal.id)
    return enums.status.active
  }

  // Job progress
  if (is.job(newVal) &&
      is.job(oldVal) &&
      newVal.progress !== oldVal.progress) {
    logger(`Event: progress [${newVal.progress}]`)
    q.emit(enums.status.progress, newVal.queueId, newVal.id, newVal.progress)
    return enums.status.progress
  }

  // Job completed
  if (is.completed(newVal) &&
      !is.completed(oldVal)) {
    let isRepeating = is.repeating(newVal)
    logger(`Event: completed`, newVal.queueId, newVal.id, isRepeating)
    q.emit(enums.status.completed, newVal.queueId, newVal.id, isRepeating)
    return enums.status.completed
  }

  // Job cancelled
  if (is.cancelled(newVal) &&
      !is.cancelled(oldVal)) {
    logger(`Event: cancelled`, newVal.queueId, newVal.id)
    q.emit(enums.status.cancelled, newVal.queueId, newVal.id)
    return enums.status.cancelled
  }

  // Job failed
  if (is.failed(newVal) &&
      !is.failed(oldVal)) {
    logger(`Event: failed`, newVal.queueId, newVal.id)
    q.emit(enums.status.failed, newVal.queueId, newVal.id)
    return enums.status.failed
  }

  // Job terminated
  if (is.terminated(newVal) &&
      !is.terminated(oldVal)) {
    logger(`Event: terminated`, newVal.queueId, newVal.id)
    q.emit(enums.status.terminated, newVal.queueId, newVal.id)
    return enums.status.terminated
  }

  // Job removed
  if (!is.job(newVal) &&
      is.job(oldVal)) {
    logger(`Event: removed`, oldVal.id)
    q.emit(enums.status.removed, null, oldVal.id)
    return enums.status.removed
  }

  // Job log
  if (is.job(newVal) &&
      is.job(oldVal) &&
      is.array(newVal.log) &&
      is.array(oldVal.log) &&
      newVal.log.length > oldVal.log.length) {
    logger(`Event: log`, newVal.queueId, newVal.log)
    q.emit(enums.status.log, newVal.queueId, newVal.id)
    return enums.status.log
  }

  logger('Unknown database change', change)
}
