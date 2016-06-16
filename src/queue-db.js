const logger = require('./logger')(module)
const rethinkdbdash = require('rethinkdbdash')
const Promise = require('bluebird')
const enums = require('./enums')
const dbAssert = require('./db-assert')
const dbReview = require('./db-review')
const queueChange = require('./queue-change')

module.exports.attach = function dbAttach (q) {
  logger('attach')
  q.r = rethinkdbdash({
    host: q.host,
    port: q.port,
    db: q.db
    // silent: true TODO: Reinstate
  })
  q.ready = dbAssert(q).then(() => {
    return q.r.db(q.db).table(q.name).changes().run()
  }).then((changeFeed) => {
    q._changeFeed = changeFeed
    q._changeFeed.each((err, change) => {
      queueChange(q, err, change)
    })
    if (q.isMaster) {
      logger('Queue is a master')
      dbReview.enable(q)
    }
    q.paused = false
    q.emit(enums.queueStatus.ready)
    return true
  })
  return q.ready
}

module.exports.detach = function dbDetach (q, drainPool) {
  logger('detach')
  return Promise.resolve().then(() => {
    if (q._changeFeed) {
      q._changeFeed.close()
      q._changeFeed = false
    }
    if (q.isMaster) {
      dbReview.disable(q)
    }
    if (drainPool) {
      q.ready = false
      return q.r.getPoolMaster().drain()
    }
    return null
  }).then(() => {
    q.emit(enums.queueStatus.detached)
    return null
  })
}
