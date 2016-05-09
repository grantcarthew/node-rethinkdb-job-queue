const optionDefaults = require('./option-defaults')

module.exports.parseDbOptions = function (options = {}) {
  return {
    dbHost: options.dbHost || optionDefaults.db.dbHost,
    dbPort: options.dbPort || optionDefaults.db.dbPort,
    dbName: options.dbName || optionDefaults.db.dbName
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
