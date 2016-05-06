module.exports.connect = function (options) {
  if (!options || typeof options !== 'object') {
    throw new Error('rethinkdb-job-queue connect options object required.')
  }

  if (!options.dbName) {
    throw new Error('rethinkdb-job-queue dbName option required')
  }

  return {
    dbHost: options.dbHost || 'localhost',
    dbPort: options.dbPort || '28015',
    dbName: options.dbName
  }
}

module.exports.create = function (options) {
  let newOptions = {}

  newOptions.queueName = options.queueName || 'JobQueue'
  newOptions.stallInterval = typeof options.stallInterval === 'number'
    ? options.stallInterval : 5000

  return newOptions
}
