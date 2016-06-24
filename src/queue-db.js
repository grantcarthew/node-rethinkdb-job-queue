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
    if (q.enableChangeFeed) {
      return q.r.db(q.db).table(q.name).changes().run().then((changeFeed) => {
        q._changeFeed = changeFeed
        q._changeFeed.each((err, change) => {
          queueChange(q, err, change)
        })
      })
    }
    q._changeFeed = false
    return null
  }).then(() => {
    if (q.isMaster) {
      logger('Queue is a master')
      return dbReview.run(q, enums.reviewRun.enable)
    }
    return null
  }).then(() => {
    q.paused = false
    return true
  })
  return q.ready
}

module.exports.detach = function dbDetach (q, drainPool) {
  logger('detach')
  return Promise.resolve().then(() => {
    if (q._changeFeed) {
      let feed = q._changeFeed
      q._changeFeed = false
      return feed.close()
    }
    return null
  }).then(() => {
    if (q.isMaster) {
      return dbReview.run(q, enums.reviewRun.disable)
    }
    return null
  }).then(() => {
    if (drainPool) {
      q.ready = false
      q.paused = true
      return q.r.getPoolMaster().drain()
    }
    return null
  }).then(() => {
    if (drainPool) {
      q.emit(enums.queueStatus.detached)
    }
    return null
  })
}
