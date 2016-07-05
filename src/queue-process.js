const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbReview = require('./db-review')
const queueGetNextJob = require('./queue-get-next-job')
const jobCompleted = require('./job-completed')
const jobFailed = require('./job-failed')

const jobRun = function jobRun (job) {
  logger('jobRun', `Running: [${job.q.running}]`)
  let handled = false
  let jobTimeoutId

  function nextHandler (err, data) {
    logger('nextHandler', `Running: [${job.q.running}]`)
    logger('Job data', data)
    logger('Error', err)
    logger('handled', handled)
    // Ignore mulpiple calls to next()
    if (handled) { return }
    handled = true
    clearTimeout(jobTimeoutId)
    let finalPromise
    if (err) {
      finalPromise = jobFailed(err, job, data)
    } else {
      finalPromise = jobCompleted(job, data)
    }
    return finalPromise.then((finalResult) => {
      job.q.running--
      return setImmediate(jobTick, job.q)
    })
  }

  const timedOutMessage = `Job timed out (run time > ${job.timeout} sec)`
  jobTimeoutId = setTimeout(function timeoutHandler () {
    nextHandler(new Error(timedOutMessage))
  }, job.timeout * 1000)
    // jobTimeoutId = setTimeout(nextHandler.bind(null, Error(timedOutMessage)),
    //   job.timeout * 1000)
  job.q.emit(enums.status.processing, job.id)
  job.q.handler(job, nextHandler)
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
      // q.running has been decremented whilst talking to the database.
      setImmediate(jobTick, q)
      return
    }
    if (q.idle && !runAgain) {
      // No running jobs and no jobs in the database, we are idle.
      logger('queue idle')
      q.emit(enums.status.idle)
    }
  }

  // q._getNextJobActive stops jobs that finish at the same time causing
  // multiple database queries and breaking concurrency.
  // This is an issue because the q.running++ is not incremented until
  // after the async database query has finished.
  // If a call to jobTick is made whilst the getNextJob query is active,
  // then q._getNextJobCalled is flagged to initiate another call
  // on completion of the getNextJob database query.
  q._getNextJobActive = true
  return queueGetNextJob(q).then((jobsToDo) => {
    logger('jobsToDo', `Retrieved: [${jobsToDo.length}]`)
    if (jobsToDo.length > 0) {
      q.running += jobsToDo.length
      jobsToDo.forEach(j => jobRun(j))
    }
    getNextJobCleanup(q._getNextJobCalled)
    return null
  }).catch((err) => {
    logger('queueGetNextJob Error:', err)
    getNextJobCleanup(q._getNextJobCalled)
    q.emit(enums.status.error, err.message)
    return Promise.reject(err)
  })
}

module.exports.addHandler = function queueProcessAddHandler (q, handler) {
  logger('addHandler')

  if (q.handler) {
    return Promise.reject(new Error(enums.error.processTwice))
  }

  q.handler = handler
  q.running = 0
  return Promise.resolve().then(() => {
    if (q.isMaster) { return null }
    return dbReview.run(q, enums.reviewRun.once)
  }).then(() => {
    setImmediate(jobTick, q)
    return null
  })
}

module.exports.restart = function queueProcessRestart (q) {
  logger('restart', `Running: [${q.running}]`)
  if (!q.handler) { return }
  if (q.running < q.concurrency) {
    setImmediate(jobTick, q)
  }
}
