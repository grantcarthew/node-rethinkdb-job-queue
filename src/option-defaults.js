module.exports = {
  db: {
    host: 'localhost',
    port: '28015',
    db: 'rjqJobQueue'
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
