const Promise = require('bluebird')
const enums = require('./enums')

module.exports = function errorBooster (q, logger, name) {
  return function errorBoosterInternal (errObj) {
    errObj.queueId = q.id
    const message = `Event: ${name} error`
    logger(message, q.id, errObj)
    q.emit(enums.status.error, errObj)
    return Promise.reject(errObj)
  }
}
