module.exports.connect = function (options = {}) {
  return {
    dbHost: options.dbHost || 'localhost',
    dbPort: options.dbPort || '28015',
    dbName: options.dbName || 'JobQueue'
  }
}

module.exports.create = function (options = {}) {
  let newOptions = {}

  newOptions.queueName = options.queueName || 'JobQueue'
  newOptions.stallInterval = typeof options.stallInterval === 'number'
    ? options.stallInterval : 30

  return newOptions
}
