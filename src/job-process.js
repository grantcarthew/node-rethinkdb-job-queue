const logger = require('./logger').init(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbQueue = require('./db-queue')
const dbJob = require('./db-job')

const jobRun = function (job) {
  logger('jobRun')
  let handled = false
  const heartbeatIntervalId = dbJob.startHeartbeat(job)

  const nextHandler = (err, data) => {
    logger('nextHandler')
    // Ignore mulpiple calls to next()
    if (handled) { return }
    handled = true
    clearInterval(heartbeatIntervalId)
    job.q.running--
    if (err) {
      return dbJob.failed(err, job, data)
    } else {
      return dbJob.completed(job, data)
    }
  }

  const timedOutMessage = 'Job ' + job.id + ' timed out (' + job.timeout * 1000 + ' sec)'
  setTimeout(nextHandler.bind(null, Error(timedOutMessage)), job.timeout * 1000)
  job.q.handler(job, nextHandler)
}

const jobTick = function (q) {
  logger('jobTick')
  if (q.paused) {
    return
  }

  return dbQueue.getNextJob(q).then((jobsToDo) => {
    if (jobsToDo.length < 1) {
      return Promise.reject(enums.queueStatus.idle)
    }
    return jobsToDo
  }).then((jobsToDo) => {
    for (let jobToDo of jobsToDo) {
      q.running++
      jobRun(jobToDo)
    }
    if (q.running < q.concurrency) {
      setImmediate(jobTick, q)
    }
    return
  }).catch((err) => {
    if (err.message === enums.queueStatus.idle) {
      q.emit(enums.queueStatus.idle)
      return
    }
    q.emit(enums.queueStatus.error, err.message)
    return setImmediate(jobTick, q)
  })
}

const restartProcessing = function () {
  logger('restartProcessing')
  // maybe need to increment queued here?
  // self.bclient.once('ready', jobTick)
}

module.exports = function (q, handler) {
  logger('jobProcess')
  if (!q.isWorker) {
    throw Error('Cannot call process on a non-worker')
  }

  if (q.handler) {
    throw Error('Cannot call process twice')
  }

  q.handler = handler
  q.running = 0
  setImmediate(jobTick, q)
}
