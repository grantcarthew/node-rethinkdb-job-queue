const thinky = require('thinky')
const optionsParser = require('./options-parser')
const Queue = require('./queue')

function QueueFactory (options) {
  if (!new.target) {
    return new QueueFactory(options)
  }
  this.options = optionsParser(options)
  this.thinky = thinky({
    host: options.dbHost,
    port: options.dbPort,
    db: options.dbName
  })
}

QueueFactory.prototype.create = function (queueName) {
  return new Queue(queueName)
}

module.exports.connect = function (options) {
  return new QueueFactory(options)
}
