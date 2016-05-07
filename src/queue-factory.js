const Queue = require('./queue')
const rethinkdbdash = require('rethinkdbdash')
const optionsParser = require('./options-parser')

function QueueFactory (options) {
  this.options = optionsParser.connect(options)
  this.r = rethinkdbdash({
    host: options.dbHost,
    port: options.dbPort,
    db: options.dbName,
    pool: false
  })
}

QueueFactory.prototype.create = function (options) {
  let queueOptions = optionsParser.create(options)
  queueOptions.r = this.r
  return new Queue(queueOptions)
}

module.exports = function (options) {
  return new QueueFactory(options)
}
