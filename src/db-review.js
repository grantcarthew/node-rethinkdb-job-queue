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
  .orderBy({index: enums.index.active_dateRetry})
  .filter(
    q.r.row('dateRetry').lt(q.r.now())
  ).update({
    status: q.r.branch(
      q.r.row('retryCount').lt(q.r.row('retryMax')),
      enums.status.timeout,
      enums.status.failed
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
        enums.status.failed
      ),
      retryCount: q.r.row('retryCount'),
      message: 'Master: ' + enums.message.timeout,
      dateRetry: q.r.row('dateRetry')
    }),
    queueId: q.id
  })
  .run()
  .then((updateResult) => {
    return dbResult.status(q, updateResult, 'replaced')
  }).then((replaceCount) => {
    q.emit(enums.status.review, replaceCount)
    queueProcess.restart(q)
    return replaceCount
  })
}

function reviewEnable (q) {
  logger('db-review enable')
  if (dbReviewIntervalId) {
    return
  }
  const interval = q.masterReviewPeriod * 1000
  q.emit(enums.status.reviewEnabled)
  dbReviewIntervalId = setInterval(() => {
    return jobReview(q)
  }, interval)
}

function reviewDisable (q) {
  logger('db-review disable')
  if (dbReviewIntervalId) {
    q.emit(enums.status.reviewDisabled)
    clearInterval(dbReviewIntervalId)
    dbReviewIntervalId = false
  }
}

module.exports.run = function run (q, reviewRun) {
  logger('run', reviewRun)
  if (!Object.keys(enums.reviewRun)
  .map(key => enums.reviewRun[key]).includes(reviewRun)) {
    return Promise.reject(new Error(enums.error.reviewOptionInvalid))
  }
  if (reviewRun === enums.reviewRun.enable) {
    reviewEnable(q)
    return jobReview(q)
  }
  if (reviewRun === enums.reviewRun.disable) {
    reviewDisable(q)
    return Promise.resolve(0)
  }
  if (reviewRun === enums.reviewRun.once) {
    return jobReview(q)
  }
}

module.exports.isEnabled = function reviewIsEnabled () {
  return !!dbReviewIntervalId
}
