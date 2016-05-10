const optionDefaults = require('./option-defaults')

module.exports.parseDbConfig = function (options = {}) {
  return {
    host: options.host || optionDefaults.db.host,
    port: options.port || optionDefaults.db.port,
    db: options.db || optionDefaults.db.db
  }
}

module.exports.parseQueueOptions = function (options = {}) {
  let stallInterval = typeof options.stallInterval === 'number'
      ? options.stallInterval : optionDefaults.queue.stallInterval

  return {
    queueName: options.queueName || optionDefaults.queue.queueName,
    stallInterval: stallInterval,
    prefix: options.prefix || optionDefaults.queue.prefix,
    isWorker: options.isWorker || optionDefaults.queue.isWorker,
    getEvents: options.getEvents || optionDefaults.queue.getEvents,
    sendEvents: options.sendEvents || optionDefaults.queue.sendEvents,
    removeOnSuccess: options.removeOnSuccess ||
      optionDefaults.queue.removeOnSuccess,
    catchExceptions: options.catchExceptions ||
      optionDefaults.queue.catchExceptions
  }
}
