const dbHost = module.exports.dbHost = 'localhost'
const dbPort = module.exports.dbPort = 28015
const dbName = module.exports.dbName = 'rjqJobQueueTests'
const queueName = module.exports.queueName = 'rjqJobQueueTestJobs'

module.exports.testData = 'The quick brown fox jumped over the lazy dog'

const connection = module.exports.connection = function () {
  return {
    host: dbHost,
    port: dbPort,
    db: dbName,
    silent: true
  }
}
module.exports.default = function () {
  const opts = {
    name: queueName,
    concurrency: 3,
    masterInterval: false
  }
  return Object.assign(opts, connection())
}
module.exports.master = function (interval = 5) {
  const opts = {
    name: queueName,
    concurrency: 3,
    masterInterval: interval
  }
  return Object.assign(opts, connection())
}
module.exports.queueNameOnly = function () {
  const opts = {
    name: queueName
  }
  return Object.assign(opts, connection())
}
