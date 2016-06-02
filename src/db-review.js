const logger = require('./logger')(module)
const moment = require('moment')
const enums = require('./enums')
const jobLog = require('./job-log')
let dbReviewIntervalId

function dbReviewJobTimeout (q) {
  logger('dbReviewJobTimeout: ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'))
  const r = q.r
  const timeoutDate = moment().add(-1, 'minutes').toDate()
  const log = jobLog(
    moment().toDate(),
    q.id,
    enums.log.type.warning,
    enums.jobStatus.timeout,
    enums.messages.timeout
  )

  return q.r.table(q.name)
  .between(q.r.minval, timeoutDate, { index: enums.index.active_dateStarted })
  .update({
    status: enums.jobStatus.timeout,
    log: q.r.row('log').add([log])
  }).run()
}

module.exports.start = function (q) {
  logger('db-review start')
  if (dbReviewIntervalId) {
    return
  }
  const interval = q.masterPollPeriod * 1000
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
