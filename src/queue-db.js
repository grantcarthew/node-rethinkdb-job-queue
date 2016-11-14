const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const uuid = require('uuid')
const hostname = require('os').hostname()
const dbAssert = require('./db-assert')
const dbReview = require('./db-review')
const queueChange = require('./queue-change')
const dbDriver = require('./db-driver')

module.exports.attach = function dbAttach (q, cxn) {
  logger('attach')
  q._r = dbDriver(cxn)
  q._host = q.r._poolMaster._options.host
  q._port = q.r._poolMaster._options.port
  q._db = q.r._poolMaster._options.db
  q._id = [
    hostname,
    q._db,
    q.name,
    process.pid,
    uuid.v4()
  ].join(':')
  q._ready = dbAssert(q).then(() => {
    if (q.changeFeed) {
      return q.r.db(q.db).table(q.name).changes().run().then((changeFeed) => {
        q._changeFeedCursor = changeFeed
        q._changeFeedCursor.each((err, change) => {
          return queueChange(q, err, change)
        })
      })
    }
    q._changeFeedCursor = false
    return null
  }).then(() => {
    if (q.master) {
      logger('Queue is a master')
      return dbReview.enable(q)
    }
    return null
  }).then(() => {
    logger(`Event: ready [${q.id}]`)
    q.emit(enums.status.ready, q.id)
    return true
  })
  return q._ready
}

module.exports.detach = function dbDetach (q, drainPool) {
  logger('detach')
  return Promise.resolve().then(() => {
    if (q._changeFeedCursor) {
      let feed = q._changeFeedCursor
      q._changeFeedCursor = false
      logger('closing changeFeed')
      return feed.close()
    }
    return true
  }).then(() => {
    if (q.master) {
      logger('disabling dbReview')
      return dbReview.disable(q)
    }
    return true
  }).then(() => {
    if (drainPool) {
      q._ready = Promise.resolve(false)
      logger('draining connection pool')
      return q.r.getPoolMaster().drain()
    }
    return true
  }).delay(1000).then(() => {
    if (drainPool) {
      logger(`Event: detached [${q.id}]`)
      q.emit(enums.status.detached, q.id)
    }
    return true
  }).delay(1000).then(() => {
    if (drainPool) {
      q.eventNames().forEach((key) => {
        q.removeAllListeners(key)
      })
    }
    return true
  })
}
