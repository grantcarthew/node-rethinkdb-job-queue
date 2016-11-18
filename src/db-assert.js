const logger = require('./logger')(module)
const Promise = require('bluebird')
const dbAssertDatabase = require('./db-assert-database')
const dbAssertTable = require('./db-assert-table')
const dbAssertIndex = require('./db-assert-index')

module.exports = function dbAssert (q) {
  logger('dbAssert')

  // The delay algorithm below is to prevent multiple Queue objects
  // attempting to create the database/table/indexes at the same time.
  // Before the delay was introduced it was possible to end up with two
  // databases in RethinkDB with the same name.
  let randomDelay = Math.floor(Math.random() * 1000)
  if (!q.master) { randomDelay += q._databaseInitDelay }

  return Promise.delay(randomDelay).then(() => {
    return dbAssertDatabase(q)
  }).then(() => {
    return dbAssertTable(q)
  }).then(() => {
    return dbAssertIndex(q)
  })
}
