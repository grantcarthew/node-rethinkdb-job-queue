const logger = require('./logger')(module)
const Promise = require('bluebird')
const datetime = require('./datetime')
const dbResult = require('./db-result')
const queueProcess = require('./queue-process')
const queueState = require('./queue-state')
const is = require('./is')
const enums = require('./enums')
const dbReviewIntervalList = new Map()

function updateFailedJobs (q) {
  logger('updateFailedJobs: ' + datetime.format(new Date()))

  return Promise.resolve().then(() => {
    return q.r.db(q.db).table(q.name)
    .orderBy({index: enums.index.indexActiveDateEnable})
    .filter(
      q.r.row('dateEnable').lt(q.r.now())
    ).update({
      status: q.r.branch(
        q.r.row('retryCount').lt(q.r.row('retryMax')),
        enums.status.failed,
        enums.status.terminated
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
        dateEnable: q.r.row('dateEnable')
      }),
      queueId: q.id
    })
    .run()
  }).then((updateResult) => {
    logger(`updateResult`, updateResult)
    return dbResult.status(updateResult, enums.dbResult.replaced)
  })
}

function removeFinishedJobsBasedOnTime (q) {
  logger('removeFinishedJobsBasedOnTime')
  return q.r.db(q.db).table(q.name)
  .orderBy({index: enums.index.indexFinishedDateFinished})
  .filter(
    q.r.row('dateFinished').add(
      q.r.expr(q.removeFinishedJobs).div(1000)
    ).lt(q.r.now())
  ).delete()
  .run()
}

function removeFinishedJobsBasedOnNow (q) {
  logger('removeFinishedJobsBasedOnNow')
  return q.r.db(q.db).table(q.name)
  .orderBy({index: enums.index.indexFinishedDateFinished})
  .filter(q.r.row('dateFinished').lt(q.r.now()))
  .delete()
  .run()
}

function removeFinishedJobs (q) {
  logger('removeFinishedJobs: ' + datetime.format(new Date()))

  if (q.removeFinishedJobs < 1 || q.removeFinishedJobs === false) {
    return Promise.resolve(0)
  }

  return Promise.resolve().then(() => {
    if (is.true(q.removeFinishedJobs)) {
      return removeFinishedJobsBasedOnNow(q)
    }
    return removeFinishedJobsBasedOnTime(q)
  }).then((deleteResult) => {
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
    runReviewTasksResult.local = true
    logger(`Event: reviewed`, runReviewTasksResult)
    q.emit(enums.status.reviewed, q.id, runReviewTasksResult)
    queueProcess.restart(q)
    return Promise.props({
      queueStateChange: queueState(q, enums.status.reviewed),
      reviewResult: runReviewTasksResult
    })
  }).then((stateChangeAndReviewResult) => {
    return stateChangeAndReviewResult.reviewResult
  })
}

module.exports.enable = function enable (q) {
  logger('enable', q.masterInterval)
  if (!dbReviewIntervalList.has(q.id)) {
    const interval = q.masterInterval
    dbReviewIntervalList.set(q.id, setInterval(() => {
      return runReviewTasks(q)
    }, interval))
  }
  return true
}

module.exports.disable = function disable (q) {
  logger('disable', q.id)
  if (dbReviewIntervalList.has(q.id)) {
    clearInterval(dbReviewIntervalList.get(q.id))
    dbReviewIntervalList.delete(q.id)
  }
  return true
}

module.exports.runOnce = function run (q) {
  logger('runOnce')
  return runReviewTasks(q)
}

module.exports.isEnabled = function reviewIsEnabled (q) {
  logger('isEnabled', q.id)
  return dbReviewIntervalList.has(q.id)
}
