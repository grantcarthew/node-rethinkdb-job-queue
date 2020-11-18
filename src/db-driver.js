const logger = require('./logger')(module)
const rethinkdbdash = require('rethinkdbdash')
const is = require('./is')
const enums = require('./enums')

module.exports = function dbDriver (cxn) {
  logger('dbDriver', cxn)
  cxn = cxn !== undefined ? cxn : {}
  const cxnCopy = Object.assign({}, cxn)

  if (Object.keys(cxn).length < 1 ||
      cxn.host != null ||
      cxn.port != null ||
      is.string(cxn.db)) {
    logger('cxn is an options object')
    cxnCopy.pingInterval = cxnCopy.reconnect?.pingInterval || enums.options.reconnect.pingInterval;
    cxnCopy.silent = cxnCopy.reconnect?.silent || enums.options.reconnect.silent;
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
