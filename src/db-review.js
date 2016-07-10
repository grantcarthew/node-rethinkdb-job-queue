const logger = require('./logger')(module)
const Promise = require('bluebird')
const moment = require('moment')
const dbResult = require('./db-result')
const queueProcess = require('./queue-process')
const enums = require('./enums')

let dbReviewIntervalId = false

function jobReview (q) {
  logger('jobReview: ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'))

  return q.r.db(q.db).table(q.name)
  .orderBy({index: enums.index.indexActiveDateRetry})
  .filter(
    q.r.row('dateRetry').lt(q.r.now())
  ).update({
    status: q.r.branch(
      q.r.row('retryCount').lt(q.r.row('retryMax')),
      enums.status.timeout,
      enums.status.terminated
    ),
    priority: q.r.branch(
      q.r.row('retryCount').lt(q.r.row('retryMax')),
      enums.priority.retry,
      q.r.row('priority')
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
    log: q.r.row('log').append({
      date: q.r.now(),
      queueId: q.id,
      type: q.r.branch(
        q.r.row('retryCount').lt(q.r.row('retryMax')),
        enums.log.warning,
        enums.log.error
      ),
      status: q.r.branch(
        q.r.row('retryCount').lt(q.r.row('retryMax')),
        enums.status.timeout,
        enums.status.terminated
      ),
      retryCount: q.r.row('retryCount'),
      message: 'Master: ' + enums.message.timeout,
      dateRetry: q.r.row('dateRetry')
    }),
    queueId: q.id
  })
  .run()
  .then((updateResult) => {
    return dbResult.status(q, updateResult, enums.dbResult.replaced)
  }).then((replaceCount) => {
    q.emit(enums.status.review, replaceCount)
    queueProcess.restart(q)
    return replaceCount
  })
}

module.exports.enable = function enable (q) {
  logger('db-review enable')
  if (!dbReviewIntervalId) {
    const interval = q.masterReviewPeriod * 1000
    dbReviewIntervalId = setInterval(() => {
      return jobReview(q)
    }, interval)
  }
  return true
}

module.exports.disable = function disable (q) {
  logger('db-review disable')
  if (dbReviewIntervalId) {
    clearInterval(dbReviewIntervalId)
    dbReviewIntervalId = false
  }
  return true
}

module.exports.runOnce = function run (q) {
  logger('run')
  return jobReview(q)
}

module.exports.isEnabled = function reviewIsEnabled () {
  return !!dbReviewIntervalId
}
