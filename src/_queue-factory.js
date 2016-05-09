const Promise = require('bluebird')
const Queue = require('./queue')
const rethinkdbdash = require('rethinkdbdash')
const optionsParser = require('./options-parser')
const logger = require('./logger')

function QueueFactory (options) {
  this.options = optionsParser.connect(options)
  this.r = rethinkdbdash()
  this.assertDbPromise = Promise.resolve(false)
}

QueueFactory.prototype.create = function (options) {
  let queueOptions = optionsParser.create(options)
  queueOptions.r = this.r
  queueOptions.dbName = this.options.dbName
  return this._assertDb().then(() => {
    return new Queue(queueOptions)
  })
}

// Ensures the database specified exists
QueueFactory.prototype._assertDb = function () {
  return this.assertDbPromise.then((dbAsserted) => {
    if (dbAsserted) {
      return undefined
    }

    this.assertDbPromise = this.r.dbList().contains(this.options.dbName)
      .do((databaseExists) => {
        return this.r.branch(
          databaseExists,
          { dbs_created: 0 },
          this.r.dbCreate(this.options.dbName)
        )
      }).run().then((result) => {
        result.dbs_created > 0
        ? logger('Database created: ' + this.options.dbName)
        : logger('Database exists: ' + this.options.dbName)
        return true
      })
    return this.assertDbPromise
  })
}

module.exports = function (options) {
  return new QueueFactory(options)
}
