module.exports = {
  db: {
    dbHost: 'localhost',
    dbPort: '28015',
    dbName: 'rjqJobQueue'
  },
  queue: {
    queueName: 'rjqJobQueue',
    stallInterval: 30,
    prefix: 'bq',
    isWorker: true,
    getEvents: true,
    sendEvents: true,
    removeOnSuccess: false,
    catchExceptions: false
  }
}
