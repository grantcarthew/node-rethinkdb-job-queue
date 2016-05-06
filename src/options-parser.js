module.exports.connect = function (options) {
  if (!options || typeof options !== 'object') {
    throw new Error('rethinkdb-job-queueconnect options object required.')
  }

  if (!options.dbName) {
    throw new Error('rethinkdb-jobqueue dbName options required')
  }

  options = options || {}
  options = {
    dbHost: options.dbHost || 'localhost',
    dbPort: options.dbPort || '28015',
    dbName: options.dbName
  }

  return options
}

module.exports.create = function (options) {

  dbTableName: options.dbTableName || 'JobQueue',
  stallInterval: typeof options.stallInterval === 'number' ?
    options.stallInterval : 5000

}
