module.exports = {
  db: {
    dbHost: 'localhost',
    dbPort: '28015',
    dbName: 'JobQueue'
  },
  queue: {
    queueName: 'JobQueue',
    stallInterval: 30,
    prefix: 'bq',
    isWorker: true,
    getEvents: true,
    sendEvents: true,
    removeOnSuccess: false,
    catchExceptions: false
  }
}
