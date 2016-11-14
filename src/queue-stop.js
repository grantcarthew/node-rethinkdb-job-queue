const logger = require('./logger')(module)
const enums = require('./enums')
const queueDb = require('./queue-db')

module.exports = function queueStop (q) {
  logger('queueStop')
  logger(`Event: stopping [${q.id}]`)
  q.emit(enums.status.stopping, q.id)
  return q.pause().then(() => {
    return queueDb.detach(q)
  }).then(() => {
    logger(`Event: stopped [${q.id}]`)
    q.emit(enums.status.stopped, q.id)
    return true
  })
}
