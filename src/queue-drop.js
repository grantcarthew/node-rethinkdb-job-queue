const logger = require('./logger')(module)
const enums = require('./enums')
const queueDb = require('./queue-db')
const queueStop = require('./queue-stop')

module.exports = function queueDrop (q, dropTimeout) {
  logger('queueDrop')
  return queueStop(q, dropTimeout, false).then(() => {
    q.ready = false
    return q.r.db(q.db).tableDrop(q.name).run()
  }).then(() => {
    return queueDb.detach(q, true)
  }).then(() => {
    logger(`Event: dropped [${q.id}]`)
    q.emit(enums.status.dropped, q.id)
    return true
  })
}
