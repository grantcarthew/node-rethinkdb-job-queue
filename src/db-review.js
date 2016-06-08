const logger = require('./logger')(module)
const moment = require('moment')
const enums = require('./enums')
let dbReviewIntervalId

function jobTimeout (q) {
  logger('jobTimeout: ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'))

  return q.r.db(q.db).table(q.name)
  .orderBy({index: enums.index.active_dateStarted})
  .filter(
    q.r.row('dateStarted')
    .add(q.r.row('timeout'))
    .add(60)
    .lt(q.r.now())
  ).update({
    status: q.r.branch(
      q.r.row('retryCount').lt(q.r.row('retryMax')),
      enums.jobStatus.timeout,
      enums.jobStatus.failed
    ),
    dateTimeout: q.r.now(),
    dateFailed: q.r.branch(
      q.r.row('retryCount').lt(q.r.row('retryMax')),
      null,
      q.r.now()
    ),
    retryCount: q.r.branch(
      q.r.row('retryCount').lt(q.r.row('retryMax')),
      q.r.row('retryCount').add(1),
      q.r.row('retryCount')
    ),
    log: q.r.row('log').add([{
      logDate: q.r.now(),
      queueId: q.id,
      logType: q.r.branch(
        q.r.row('retryCount').lt(q.r.row('retryMax')),
        enums.log.warning,
        enums.log.error
      ),
      status: q.r.branch(
        q.r.row('retryCount').lt(q.r.row('retryMax')),
        enums.jobStatus.timeout,
        enums.jobStatus.failed
      ),
      queueMessage: enums.message.timeout,
      duration: q.r.now().toEpochTime()
        .sub(q.r.row('dateStarted').toEpochTime())
        .mul(1000).round()
    }])
  })
  .run()
  .then((updateResult) => {
    q.emit(enums.queueStatus.review, updateResult.replaced)
    return updateResult
  })
}

module.exports.start = function (q) {
  logger('db-review start')
  if (dbReviewIntervalId) {
    return
  }
  const interval = q.masterReviewPeriod * 1000
  dbReviewIntervalId = setInterval(() => {
    return jobTimeout(q)
  }, interval)
}

module.exports.stop = function (q) {
  logger('db-review stop')
  if (dbReviewIntervalId) {
    clearInterval(dbReviewIntervalId)
  }
}

module.exports.jobTimeout = jobTimeout
