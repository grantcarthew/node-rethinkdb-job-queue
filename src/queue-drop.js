const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const queueDb = require('./queue-db')
const queueStop = require('./queue-stop')

module.exports = function queueDrop (q) {
  logger('queueDrop')
  return queueStop(q).then(() => {
    q._ready = Promise.resolve(false)
    return queueDb.detach(q)
  }).then(() => {
    return q.r.db(q.db)
    .tableDrop(q.name)
    .run(q.queryRunOptions)
  }).then(() => {
    logger(`Event: dropped [${q.id}]`)
    q.emit(enums.status.dropped, q.id)
    return queueDb.drain(q)
  })
}
