const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const uuid = require('uuid')
const hostname = require('os').hostname()
const dbAssert = require('./db-assert')
const dbReview = require('./db-review')
const queueChange = require('./queue-change')
const dbDriver = require('./db-driver')
const { ReqlDriverError, ReqlServerError } = require('rethinkdbdash/lib/error')

function _isConnectionError(err) {
  // Credit: https://github.com/LearnersGuild/rethinkdb-changefeed-reconnect/blob/master/src/index.js#L82
  // FIXME: I'm not terribly happy about this particular logic, but
  // unfortunately, rethinkdbdash doesn't provide a consistent error type (or
  // even message) when it's having trouble connecting to a changefeed,
  // particularly if it is connecting via a rethinkdb proxy server.
  return (err instanceof ReqlServerError) ||
    (err instanceof ReqlDriverError) ||
    (err.msg && err.msg.match(/Changefeed\saborted/)) ||
    (err.msg && err.msg.match(/primary\sreplica.*not\savailable/));
}

function tryReconnect(q, error, maxAttempts, attemptDelay, nRetryAttempt) {
  // if we are detaching (or detached), lets not crash the app with connection errors.
  if (q._dbDetached) return error;
  // if this is connection error, lets try reconnecting.
  if (_isConnectionError(error)) {
    // if no further attempts left, throw it as it is.
    if (++nRetryAttempt > maxAttempts)
      throw error;
    // try reconnection after some linear delay.
    logger(`connection error, retry after ${nRetryAttempt * attemptDelay / 1000} sec`);
    return Promise.resolve().delay(nRetryAttempt * attemptDelay)
      .then(() => monitorChangeFeed(q, { maxAttempts, attemptDelay }, nRetryAttempt));
  }
  throw error;
}

function monitorChangeFeed(q, {
  maxAttempts = enums.options.reconnect.maxAttempts,
  attemptDelay = enums.options.reconnect.attemptDelay } = {}, nRetryAttempt = 0) {

  logger('monitorChangeFeed');

  return q.r.db(q.db).table(q.name).changes().run(q.queryRunOptions).then(function (changeFeed) {
    // we connected successfully, lets reset the counter
    nRetryAttempt = 0;
    // fetch each change and act on it
    q._changeFeedCursor = changeFeed;
    return q._changeFeedCursor.each(function (error, change) {
      if (error) return tryReconnect(q, error, maxAttempts, attemptDelay, nRetryAttempt);
      return queueChange(q, error, change);
    });
  }).catch(error => tryReconnect(q, error, maxAttempts, attemptDelay, nRetryAttempt));
}

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
      return monitorChangeFeed(q, cxn.reconnect);
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
  q._dbDetached = false;
  return q._ready
}

module.exports.detach = function dbDetach (q) {
  logger('detach')
  return Promise.resolve().then(() => {
    q._dbDetached = true;
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
  })
}

module.exports.drain = function drain (q) {
  return Promise.resolve().then(() => {
    q._ready = Promise.resolve(false)
    logger('draining connection pool')
    return q.r.getPoolMaster().drain()
  }).delay(1000).then(() => {
    logger(`Event: detached [${q.id}]`)
    q.emit(enums.status.detached, q.id)
  }).delay(1000).then(() => {
    q.eventNames().forEach((key) => {
      q.removeAllListeners(key)
    })
    return true
  })
}
