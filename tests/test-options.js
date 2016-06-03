const dbHost = module.exports.dbHost = 'localhost'
const dbPort = module.exports.dbPort = '28015'
const dbName = module.exports.dbName = 'rjqJobQueueUnitTests'
const queueName = module.exports.queueName = 'rjqJobQueueUnitTestsJobList'

module.exports.connectionOptions = {
  host: dbHost,
  port: dbPort,
  db: dbName
}

module.exports.queueDefaultOptions = {
  queueName,
  concurrency: 3,
  masterReviewPeriod: 6
}

module.exports.jobOptionsHigh = {
  priority: 'highest',
  timeout: 4,
  retryMax: 2,
  retryDelay: 20
}
