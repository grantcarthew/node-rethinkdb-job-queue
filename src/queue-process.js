const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbReview = require('./db-review')
const queueGetNextJob = require('./queue-get-next-job')
const jobCompleted = require('./job-completed')
const queueCancelJob = require('./queue-cancel-job')
const jobFailed = require('./job-failed')

const jobRun = function jobRun (job) {
  logger('jobRun', `Running: [${job.q._running}]`)
  let handled = false
  let jobTimeoutId
  let finalPromise

  function nextHandler (err, data) {
    logger('nextHandler', `Running: [${job.q._running}]`)
    logger('Job data', data)
    logger('Error', err)
    logger('handled', handled)
    // Ignore mulpiple calls to next()
    if (handled) {
      return Promise.resolve(job.q._running)
    }
    handled = true
    clearTimeout(jobTimeoutId)
    if (err && err.cancelJob) {
      const reason = err.cancelReason ? err.cancelReason : enums.message.cancel
      finalPromise = queueCancelJob(job.q, job, reason)
    } else if (err) {
      finalPromise = jobFailed(err, job, data)
    } else {
      finalPromise = jobCompleted(job, data)
    }
    return finalPromise.then((finalResult) => {
      job.q._running--
      setImmediate(jobTick, job.q)
      return job.q._running
    })
  }

  const timedOutMessage = `Job timed out (run time > ${job.timeout} sec)`
  jobTimeoutId = setTimeout(function timeoutHandler () {
    logger('timeoutHandler called, job timeout value exceeded')
    nextHandler(new Error(timedOutMessage))
  }, job.timeout * 1000)
  logger(`Event: processing [${job.id}]`)
  job.q.emit(enums.status.processing, job.id)
  logger('calling handler function')
  job.q._handler(job, nextHandler)
}

const jobTick = function jobTick (q) {
  logger('jobTick', `Running: [${q._running}]`)
  if (q._getNextJobActive) { q._getNextJobCalled = true }
  if (q.paused || q._getNextJobActive) { return }

  function getNextJobCleanup (runAgain) {
    logger(`getNextJobCleanup`)
    logger(`runAgain: [${runAgain}]`)
    logger(`Running: [${q._running}]`)
    q._getNextJobActive = false
    q._getNextJobCalled = false
    if (q._running < q._concurrency && runAgain) {
      // q._running has been decremented whilst talking to the database.
      setImmediate(jobTick, q)
      return
    }
    if (q.idle && !runAgain) {
      // No running jobs and no jobs in the database, we are idle.
      logger(`Event: idle [${q.id}]`)
      q.emit(enums.status.idle, q.id)
    }
  }

  // q._getNextJobActive stops jobs that finish at the same time causing
  // multiple database queries and breaking concurrency.
  // This is an issue because the q._running++ is not incremented until
  // after the async database query has finished.
  // If a call to jobTick is made whilst the getNextJob query is active,
  // then q._getNextJobCalled is flagged to initiate another call
  // on completion of the getNextJob database query.
  q._getNextJobActive = true
  return queueGetNextJob(q).then((jobsToDo) => {
    logger('jobsToDo', `Retrieved: [${jobsToDo.length}]`)
    if (jobsToDo.length > 0) {
      q._running += jobsToDo.length
      jobsToDo.forEach(j => jobRun(j))
    }
    getNextJobCleanup(q._getNextJobCalled)
    return null
  }).catch((err) => {
    logger('queueGetNextJob Error:', err)
    getNextJobCleanup(q._getNextJobCalled)
    logger(`Event: error [${err.message}]`, err)
    q.emit(enums.status.error, err.message)
    return Promise.reject(err)
  })
}

module.exports.addHandler = function queueProcessAddHandler (q, handler) {
  logger('addHandler')

  if (q._handler) {
    return Promise.reject(new Error(enums.message.processTwice))
  }

  q._handler = handler
  q._running = 0
  return Promise.resolve().then(() => {
    if (q.master) { return null }
    return dbReview.runOnce(q)
  }).then(() => {
    setImmediate(jobTick, q)
    return null
  })
}

module.exports.restart = function queueProcessRestart (q) {
  logger('restart', `Running: [${q._running}]`)
  if (!q._handler) { return }
  if (q._running < q._concurrency) {
    setImmediate(jobTick, q)
  }
}
