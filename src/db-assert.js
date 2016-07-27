const logger = require('./logger')(module)
const dbAssertDatabase = require('./db-assert-database')
const dbAssertTable = require('./db-assert-table')
const dbAssertIndex = require('./db-assert-index')

module.exports = function dbAssert (q) {
  logger('dbAssert')
  return dbAssertDatabase(q).then(() => {
    return dbAssertTable(q)
  }).then(() => {
    return dbAssertIndex(q)
  })
}
