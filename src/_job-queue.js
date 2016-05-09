const QueueFactory = require('./queue-factory')

module.exports.connect = function (options) {
  return new QueueFactory(options)
}
