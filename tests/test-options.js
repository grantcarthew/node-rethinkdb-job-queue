const dbHost = module.exports.dbHost = 'localhost'
const dbPort = module.exports.dbPort = 28015
const dbName = module.exports.dbName = 'rjqJobQueueTests'

module.exports.tData = 'The quick brown fox jumped over the lazy dog'
module.exports.lData = { one_key: 'The quick brown fox jumped over the lazy dog', some_other_key: 0.2 }

module.exports.cxn = function () {
  return {
    host: dbHost,
    port: dbPort,
    db: dbName
  }
}
module.exports.default = function (queueName) {
  return {
    name: queueName,
    concurrency: 3,
    masterInterval: false
  }
}
module.exports.master = function (queueName, interval = 5000) {
  return {
    name: queueName,
    concurrency: 3,
    masterInterval: interval
  }
}
module.exports.queueNameOnly = function (queueName) {
  return {
    name: queueName
  }
}
