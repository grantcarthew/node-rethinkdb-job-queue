const Queue = require('./queue')
const thinky = require('thinky')
const optionsParser = require('./options-parser')

function QueueFactory (options) {
  this.options = optionsParser.connect(options)
  this.thinky = thinky({
    host: options.dbHost,
    port: options.dbPort,
    db: options.dbName
  })
}

QueueFactory.prototype.create = function (options) {
  let queueOptions = optionsParser.create(options)
  queueOptions.thinky = this.thinky
  return new Queue(queueOptions)
}

module.exports = function (options) {
  return new QueueFactory(options)
}
