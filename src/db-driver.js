const logger = require('./logger')(module)
// const rethinkdbdash = require('rethinkdbdash')
const rethinkdbdash = require('rethinkdb-changefeed-reconnect')
const is = require('./is')
const enums = require('./enums')

module.exports = function dbDriver (cxn) {
  logger('dbDriver', cxn)
  cxn = cxn !== undefined ? cxn : {}
  let reconnectOptions = {
    changefeedName: cxn._name || // not sure what
    maxAttempts: 10,
    attemptDelay: 10000,
    silent: false,
    logger: global.console,
  }
  const cxnCopy = Object.assign({}, reconnectOptions, cxn)

  if (Object.keys(cxn).length < 1 ||
      cxn.host != null ||
      cxn.port != null ||
      is.string(cxn.db)) {
    logger('cxn is an options object')
    cxnCopy.silent = true
    cxnCopy.host = cxnCopy.host == null
      ? enums.options.host : cxnCopy.host
    cxnCopy.port = cxnCopy.port == null
      ? enums.options.port : cxnCopy.port
    cxnCopy.db = cxnCopy.db == null
      ? enums.options.db : cxnCopy.db
    return rethinkdbdash(cxnCopy)
  }

  if (cxn.getPoolMaster) {
    logger('cxn is a rethinkdbdash object')
    return cxn
  }

  throw new Error('Database driver or options invalid')
}
