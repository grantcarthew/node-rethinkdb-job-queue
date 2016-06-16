const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbReview = require('./db-review')

module.exports = function queueStop (q, stopTimeout, drainPool = true) {
  logger('deleteQueue')
  q.emit(enums.queueStatus.stopping)
  q.paused = true
  let stopIntervalId
  let stopTimeoutId
  const cleanUp = (drainPoolNow) => {
    return q.detachFromDb(drainPoolNow).then(() => {
      if (stopIntervalId) { clearInterval(stopIntervalId) }
      if (stopTimeoutId) { clearTimeout(stopTimeoutId) }
    })
  }

  logger('Waiting half stop time')
  return Promise.delay(stopTimeout / 2)
  .then(() => {
    return new Promise((resolve) => {
      stopTimeoutId = setTimeout(() => {
        logger('Queue stopped forcefully')
        return cleanUp(drainPool).then(() => {
          q.emit(enums.queueStatus.stopped)
          q.running < 1 ? resolve(enums.message.allJobsStopped)
            : resolve(enums.message.failedToStop)
        })
      }, stopTimeout / 2)

      stopIntervalId = setInterval(() => {
        if (q.running < 1) {
          logger('Queue stopped gracefully')
          return cleanUp(drainPool).then(() => {
            q.emit(enums.queueStatus.stopped)
            resolve(enums.message.allJobsStopped)
          })
        }
      }, stopTimeout / 12)

      return q.detachFromDb(false)
    })
  })
}
