const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const is = require('./is')
const errorBooster = require('./error-booster')
const queueGetNextJob = require('./queue-get-next-job')
const jobCompleted = require('./job-completed')
const jobUpdate = require('./job-update')
const queueCancelJob = require('./queue-cancel-job')
const jobFailed = require('./job-failed')
const jobTimeouts = new Map()
const jobOnCancelHandlers = new Map()

function addJobTimeout (job, timeoutHandler) {
  logger('addJobTimeout', job)
  const timeoutValue = job.timeout
  let jobTimeout = {
    timeoutHandler,
    timeoutValue,
    timeoutId: setTimeout(timeoutHandler, timeoutValue)
  }
  jobTimeouts.set(job.id, jobTimeout)
}

function addOnCancelHandler (job, cancellationCallback) {
  logger('addJobCancellation', job.id)
  if (is.function(cancellationCallback)) {
    jobOnCancelHandlers.set(job.id, cancellationCallback)
  } else {
    let err = new Error(enums.message.cancelCallbackInvalid)
    err.queueId = job.q.id
    logger(`Event: addOnCancelHandler error`, err, job.q.id)
    job.q.emit(enums.status.error, err)
    throw err
  }
}

function removeJobTimeoutAndOnCancelHandler (jobId) {
  logger('removeJobTimeoutAndOnCancelHandler', jobId)
  if (jobTimeouts.has(jobId)) {
    const jobTimeout = jobTimeouts.get(jobId)
    clearTimeout(jobTimeout.timeoutId)
    jobTimeouts.delete(jobId)
  }
  jobOnCancelHandlers.delete(jobId)
}

function onCancelJob (jobId, q) {
  logger('onCancelJob', jobId)
  if (jobOnCancelHandlers.has(jobId)) {
    const onCancelHandler = jobOnCancelHandlers.get(jobId)
    removeJobTimeoutAndOnCancelHandler(jobId)
    q._running--
    // Calling the user defined cancel function
    onCancelHandler()
    setImmediate(jobTick, q)
  }
}

function restartJobTimeout (queueId, jobId) {
  logger('resetJobTimeout', queueId, jobId)
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

  function nextHandler (err, jobResult) {
    logger('nextHandler', `Running: [${job.q.running}]`, err, jobResult)
    logger('handled', handled)
    // Ignore mulpiple calls to next()
    if (handled) {
      return Promise.resolve(job.q.running)
    }
    handled = true

    removeJobTimeoutAndOnCancelHandler(job.id)

    function cancelJobAction () {
      logger('Job is being cancelled')
      return queueCancelJob(job.q, job, err.cancelJob)
    }

    function errAction (err) {
      logger('jobResult is an error')
      const isCancelJob = (is.object(err) || is.error(err)) && err.cancelJob
      return isCancelJob ? cancelJobAction()
        : jobFailed(job, err)
    }

    function setJobStatusToWaiting () {
      logger('Invalid job status', job.status)
      logger('Setting job status to: ' + enums.status.waiting)
      job.status = enums.status.waiting
    }

    function updateJobAction (jobToUpdate) {
      logger('Job is being updated')
      jobToUpdate.status === enums.status.active && setJobStatusToWaiting()
      return jobUpdate(jobToUpdate)
    }

    function resultAction (validJobResult) {
      logger('jobResult is valid')
      let resultIsJob = is.job(validJobResult) && is.object(validJobResult.q)
      return resultIsJob
        ? updateJobAction(validJobResult)
        : jobCompleted(job, validJobResult)
    }

    let returnPromise = err ? errAction(err) : resultAction(jobResult)

    return returnPromise.then((finalResult) => {
      job.q._running--
      setImmediate(jobTick, job.q)
      return job.q.running
    }).catch(errorBooster(job.q, logger, 'next() Promise'))
  }

  function timeoutHandler () {
    logger('timeoutHandler called, job timeout value exceeded', job.timeout)
    const timedOutMessage = `Job timed out (run time > ${job.timeout} ms)`
    nextHandler(new Error(timedOutMessage))
  }

  addJobTimeout(job, timeoutHandler)
  logger(`Event: processing [${job.id}]`)
  job.q.emit(enums.status.processing, job.q.id, job.id)
  logger('calling handler function')
  job.q._handler(job, nextHandler, addOnCancelHandler)
}

const jobTick = function jobTick (q) {
  logger('jobTick')
  logger(`Running: [${q.running}]`)
  logger(`_getNextJobActive [${q._getNextJobActive}]`)
  logger(`_getNextJobCalled [${q._getNextJobCalled}]`)
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
    getNextJobCleanup(q._getNextJobCalled)
    return errorBooster(q, logger, 'queueGetNextJob')(err)
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
  q.on(enums.status.cancelled, (queueId, jobId) => onCancelJob(jobId, q))

  // Returning a Promise so the jobTick is initiated
  // after the dbReview process. The Promise can be ignored.
  return Promise.resolve().then(() => {
    if (q.master) { return true }
    return q.review()
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
