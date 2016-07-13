const logger = require('./logger')(module)
const Promise = require('bluebird')
const moment = require('moment')
const dbResult = require('./db-result')
const queueProcess = require('./queue-process')
const enums = require('./enums')

let dbReviewIntervalId = false

function updateFailedJobs (q) {
  logger('updateFailedJobs: ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'))

  return q.r.db(q.db).table(q.name)
  .orderBy({index: enums.index.indexActiveDateRetry})
  .filter(
    q.r.row('dateRetry').lt(q.r.now())
  ).update({
    status: q.r.branch(
      q.r.row('retryCount').lt(q.r.row('retryMax')),
      enums.status.failed,
      enums.status.terminated
    ),
    priority: q.r.branch(
      q.r.row('retryCount').lt(q.r.row('retryMax')),
      enums.priority.retry,
      q.r.row('priority')
    ),
    dateFinished: q.r.now(),
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
        enums.status.failed,
        enums.status.terminated
      ),
      retryCount: q.r.row('retryCount'),
      message: `Master: ${enums.message.failed}`,
      dateRetry: q.r.row('dateRetry')
    }),
    queueId: q.id
  })
  .run()
  .then((updateResult) => {
    logger(`updateResult`, updateResult)
    return dbResult.status(updateResult, enums.dbResult.replaced)
  })
}

function removeFinishedJobs (q) {
  logger('removeFinishedJobs: ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'))

  if (q.removeFinishedJobs < 1 || q.removeFinishedJobs === false) { return }

  return q.r.db(q.db).table(q.name)
  .orderBy({index: enums.index.indexFinishedDateFinished})
  .filter(
    q.r.row('dateFinished').add(
      q.r.expr(q.removeFinishedJobs).mul(86400)
    ).lt(q.r.now())
  ).delete()
  .run()
  .then((deleteResult) => {
    logger(`deleteResult`, deleteResult)
    return dbResult.status(deleteResult, enums.dbResult.deleted)
  })
}

function runReviewTasks (q) {
  logger(`runReviewTasks`)
  return Promise.props({
    reviewed: updateFailedJobs(q),
    removed: removeFinishedJobs(q)
  }).then((runReviewTasksResult) => {
    logger(`Event: review`, runReviewTasksResult)
    q.emit(enums.status.review, runReviewTasksResult)
    queueProcess.restart(q)
    return runReviewTasksResult
  })
}

module.exports.enable = function enable (q) {
  logger('enable')
  if (!dbReviewIntervalId) {
    const interval = q.masterReviewPeriod * 1000
    dbReviewIntervalId = setInterval(() => {
      return runReviewTasks(q)
    }, interval)
  }
  return true
}

module.exports.disable = function disable (q) {
  logger('disable')
  if (dbReviewIntervalId) {
    clearInterval(dbReviewIntervalId)
    dbReviewIntervalId = false
  }
  return true
}

module.exports.runOnce = function run (q) {
  logger('runOnce')
  return runReviewTasks(q)
}

module.exports.isEnabled = function reviewIsEnabled () {
  logger('isEnabled')
  return !!dbReviewIntervalId
}
