const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbReview = require('./db-review')

module.exports = function (q, stopTimeout, drainPool = true) {
  logger('deleteQueue')
  q.paused = true
  let stopIntervalId
  let stopTimeoutId
  const cleanUp = (drainPoolNow) => {
    return q.detachFromDb(drainPoolNow).then(() => {
      if (stopIntervalId) { clearInterval(stopIntervalId) }
      if (stopIntervalId) { clearInterval(stopIntervalId) }
    })
  }

  return q.ready.then(() => {
    logger('Waiting half stop time')
    return Promise.delay(stopTimeout / 2)
  }).then(() => {
    return new Promise((resolve) => {
      stopTimeoutId = setTimeout(() => {
        return cleanUp(drainPool).then(() => {
          q.running < 1 ? resolve(enums.message.allJobsStopped)
            : resolve(enums.message.failedToStop)
        })
      }, stopTimeout / 2)

      stopIntervalId = setInterval(() => {
        if (q.running < 1) {
          return cleanUp(false).then(() => {
            resolve(enums.message.allJobsStopped)
          })
        }
      }, stopTimeout / 12)

      return q.detachFromDb(false)
    })
  })
}
