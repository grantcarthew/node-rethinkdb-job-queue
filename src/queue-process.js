const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbReview = require('./db-review')
const queueGetNextJob = require('./queue-get-next-job')
const jobCompleted = require('./job-completed')
const queueCancelJob = require('./queue-cancel-job')
const jobFailed = require('./job-failed')
const jobTimeouts = new Map()

function addJobTimeout (job, timeoutHandler) {
  logger('addJobTimeout')
  const timeoutValue = job.timeout * 1000
  let jobTimeout = {
    timeoutHandler,
    timeoutValue,
    timeoutId: setTimeout(timeoutHandler, timeoutValue)
  }
  jobTimeouts.set(job.id, jobTimeout)
}

function removeJobTimeout (jobId) {
  logger('removeJobTimeout')
  if (jobTimeouts.has(jobId)) {
    const jobTimeout = jobTimeouts.get(jobId)
    clearTimeout(jobTimeout.timeoutId)
    jobTimeouts.delete(jobId)
  }
}

function restartJobTimeout (jobId) {
  logger('resetJobTimeout')
  let jobTimeout
  if (jobTimeouts.has(jobId)) {
    jobTimeout = jobTimeouts.get(jobId)
    clearTimeout(jobTimeout.timeoutId)
    jobTimeout.timeoutId = setTimeout(
      jobTimeout.timeoutHandler,
      jobTimeout.timeoutValue)
  }
}

function jobRun (job) {
  logger('jobRun', `Running: [${job.q.running}]`)
  let handled = false

  function nextHandler (jobResult) {
    logger('nextHandler', `Running: [${job.q.running}]`, jobResult)
    logger('handled', handled)
    // Ignore mulpiple calls to next()
    if (handled) {
      return Promise.resolve(job.q.running)
    }
    handled = true

    removeJobTimeout(job.id)

    return new Promise((resolve, reject) => {
      logger('Promise resolving or rejecting jobResult')
      if (jobResult instanceof Error) { reject(jobResult) }
      resolve(jobResult)
    }).then((successResult) => {
      logger('jobResult resolved successfully')
      return jobCompleted(job, successResult)
    }).catch((err) => {
      logger('jobResult is an error')
      if (err && err.cancelJob) {
        return queueCancelJob(job.q, job, err.cancelJob)
      } else if (err) {
        return jobFailed(job, err)
      }
    }).then((finalResult) => {
      job.q._running--
      setImmediate(jobTick, job.q)
      return job.q.running
    }).catch((err) => {
      logger('next() Promise Error:', err)
      job.q.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  function timeoutHandler () {
    logger('timeoutHandler called, job timeout value exceeded', job.timeout)
    const timedOutMessage = `Job timed out (run time > ${job.timeout} sec)`
    nextHandler(new Error(timedOutMessage))
  }

  addJobTimeout(job, timeoutHandler)
  logger(`Event: processing [${job.id}]`)
  job.q.emit(enums.status.processing, job.id)
  logger('calling handler function')
  job.q._handler(job, nextHandler)
}

const jobTick = function jobTick (q) {
  logger('jobTick', `Running: [${q.running}]`)
  if (q._getNextJobActive) { q._getNextJobCalled = true }
  if (q.paused || q._getNextJobActive) { return }

  function getNextJobCleanup (runAgain) {
    logger(`getNextJobCleanup`)
    logger(`runAgain: [${runAgain}]`)
    logger(`Running: [${q.running}]`)
    q._getNextJobActive = false
    q._getNextJobCalled = false
    if (q.running < q.concurrency && runAgain) {
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
    q.emit(enums.status.error, err)
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
  q.on(enums.status.progress, restartJobTimeout)

  return Promise.resolve().then(() => {
    if (q.master) { return true }
    return dbReview.runOnce(q)
  }).then(() => {
    setImmediate(jobTick, q)
    return true
  })
}

module.exports.restart = function queueProcessRestart (q) {
  logger('restart', `Running: [${q.running}]`)
  if (!q._handler) { return }
  if (q.running < q.concurrency) {
    setImmediate(jobTick, q)
  }
}
