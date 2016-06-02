const logger = require('./logger')(module)
const moment = require('moment')
const enums = require('./enums')
const jobLog = require('./job-log')
let dbReviewIntervalId

function dbReviewJobTimeout (q) {
  logger('dbReviewJobTimeout: ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'))

  return q.r.table(q.name)
  .orderBy({index: 'active_dateStarted'})
  .filter(
    q.r.row('dateStarted')
    .add(q.r.row('timeout'))
    .add(60)
    .lt(q.r.now())
  ).update({
    status: enums.jobStatus.timeout,
    log: q.r.row('log').add([{
      logDate: q.r.now(),
      queueId: q.id,
      logType: enums.log.warning,
      status: enums.jobStatus.timeout,
      queueMessage: enums.message.timeout,
      duration: q.r.now().toEpochTime()
        .sub(q.r.row('dateStarted').toEpochTime())
        .mul(1000).round(),
      jobData: ''
    }])
  }).run()
}

module.exports.start = function (q) {
  logger('db-review start')
  if (dbReviewIntervalId) {
    return
  }
  const interval = q.masterReviewPeriod * 1000
  dbReviewIntervalId = setInterval(() => {
    return dbReviewJobTimeout(q)
  }, interval)
}

module.exports.stop = function (q) {
  logger('db-review stop')
  if (dbReviewIntervalId) {
    clearInterval(dbReviewIntervalId)
  }
}

module.exports.dbReviewJobTimeout = dbReviewJobTimeout
