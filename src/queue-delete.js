const logger = require('./logger')(module)
const Promise = require('bluebird')
const dbReview = require('./db-review')
const queueStop = require('./queue-stop')

module.exports = function (q, deleteTimeout) {
  logger('deleteQueue')
  return queueStop(q, deleteTimeout, false).then(() => {
    q.ready = false
    return q.r.dbDrop(q.db).run()
  }).then(() => {
    return q.r.getPoolMaster().drain()
  })
}
