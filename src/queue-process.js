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

  const nextHandler = (err, data) => {
    logger('nextHandler', `Running: [${job.q.running}]`)
    logger('Job data', data)
    // Ignore mulpiple calls to next()
    if (handled) { return }
    handled = true
    clearTimeout(jobTimeoutId)
    job.q.running--
    let finalPromise
    if (err) {
      finalPromise = jobFailed(err, job, data)
    } else {
      finalPromise = jobCompleted(job, data)
    }
    return finalPromise.then((finalResult) => {
      return setImmediate(jobTick, job.q)
    })
  }

  const timedOutMessage = 'Job ' + job.id + ' timed out (' + job.timeout + ' sec)'
  jobTimeoutId = setTimeout(nextHandler.bind(null, Error(timedOutMessage)), job.timeout * 1000)
  job.q.emit(enums.queueStatus.processing, job.id)
  job.q.handler(job, nextHandler)
}

const jobTick = function jobTick (q) {
  logger('jobTick', `Running: [${q.running}]`)
  if (q.paused || q.gettingNextJob) {
    return
  }

  // q.gettingNextJob stops jobs that finish at the same time causing
  // multiple database queries at the same time breaking concurrency.
  // This was an issue because the q.running++ is not incremented until
  // after the async database query has finished.
  q.gettingNextJob = true
  return queueGetNextJob(q).then((jobsToDo) => {
    logger('jobsToDo', `Retrieved: [${jobsToDo.length}]`)
    if (jobsToDo.length < 1) {
      // This is not an error! Skipping Promise chain.
      q.gettingNextJob = false
      return Promise.reject(enums.queueStatus.idle)
    }
    return jobsToDo
  }).then((jobsToDo) => {
    q.running += jobsToDo.length
    q.gettingNextJob = false
    for (let jobToDo of jobsToDo) {
      jobRun(jobToDo)
    }
    if (q.running < q.concurrency) {
      setImmediate(jobTick, q)
    }
    return null
  }).catch((err) => {
    if (err === enums.queueStatus.idle) {
      if (q.running < 1) {
        logger('queue idle')
        q.emit(enums.queueStatus.idle)
      }
      return null
    }
    q.emit(enums.queueStatus.error, err.message)
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
    if (q.isMaster) {
      return null
    }
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
