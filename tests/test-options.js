const dbHost = module.exports.dbHost = 'localhost'
const dbPort = module.exports.dbPort = '28015'
const dbName = module.exports.dbName = 'rjqJobQueueTests'
const queueName = module.exports.queueName = 'rjqJobQueueTestsJobList'

module.exports.testData = 'The quick brown fox jumped over the lazy dog'

const connection = module.exports.connection = function () {
  return {
    host: dbHost,
    port: dbPort,
    db: dbName
  }
}

module.exports.queueDefault = function () {
  const opts = {
    name: queueName,
    concurrency: 3,
    isMaster: false
  }
  return Object.assign(opts, connection())
}
module.exports.queueMaster = function () {
  return {
    queueName,
    concurrency: 3,
    isMaster: true,
    masterReviewPeriod: 6
  }
}

module.exports.jobOptionsHigh = function () {
  return {
    priority: 'highest',
    timeout: 4,
    retryMax: 2,
    retryDelay: 20
  }
}
