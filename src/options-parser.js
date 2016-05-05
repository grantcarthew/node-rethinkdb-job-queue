
module.exports = function (options) {
  if (!options || typeof options !== 'object') {
    throw new Error('rethinkdb-jobqueue options object required.')
  }

  if (!options.dbName) {
    throw new Error('rethinkdb-jobqueue dbName options required')
  }

  options = options || {};
  options = {
    dbHost: options.dbHost || 'localhost'
    dbPort: options.dbPort || '28015',
    dbName: options.dbName,
    dbTableName: options.dbTableName || 'JobQueue',
    stallInterval: typeof options.stallInterval === 'number' ?
      options.stallInterval :  5000
  };

  return options
}
