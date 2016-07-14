const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const queueDb = require('./queue-db')

module.exports = function queueStop (q, drainPool = true) {
  logger('queueStop with drain:', drainPool)
  logger(`Event: stopping [${q.id}]`)
  q.emit(enums.status.stopping, q.id)
  return q.pause().then(() => {
    return queueDb.detach(q, drainPool)
  }).then(() => {
    logger(`Event: stopped [${q.id}]`)
    q.emit(enums.status.stopped, q.id)
    return true
  })
}
