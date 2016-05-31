const Promise = require('bluebird')
const moment = require('moment')
const logger = require('./logger')
const jobHeartbeat = require('./job-heartbeat')
const dbQueue = require('./db-queue')
const dbJob = require('./db-job')

const finishJob = function (q, job, err, message) {
  logger('finishJob')
  return Promise.resolve('Not Implemented')
}

const jobRun = function (q, job) {
  logger('jobRun')
  let handled = false
  const heartbeatIntervalId = dbJob.startHeartbeat(q, job)
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2')

  const nextHandler = (err, message) => {
    logger('nextHandler')
    // Ignore mulpiple calls to next()
    if (handled) { return }
    handled = true
    clearInterval(heartbeatIntervalId)
    finishJob(q, job, err, message).then((result) => {
      console.log('finishJob result')
      console.log(result)
    })
  }

  const timedOutMessage = 'Job ' + job.id + ' timed out (' + job.timeout * 1000 + ' sec)'
  setTimeout(nextHandler.bind(null, Error(timedOutMessage)), job.timeout * 1000)

  if (q.catchExceptions) {
    try {
      q.handler(job, nextHandler)
    } catch (err) {
      nextHandler(err)
    }
  } else {
    q.handler(job, nextHandler)
  }
}

const jobTick = function (q) {
  logger('jobTick')
  if (q.paused) {
    return
  }

  // TODO: Issue with getting jobs base on concurrency value.
  return dbQueue.getNextJob(q).then((jobsToDo) => {
    if (jobsToDo.length < 1) {
      q.emit('idle')
      return Promise.reject('idle')
    }
    return jobsToDo
  }).then((jobsToDo) => {
    for (let jobToDo of jobsToDo) {
      q.running++
      jobRun(q, jobToDo)
    }
    if (q.running < q.concurrency) {
      setImmediate(jobTick, q)
    }
    return
  }).catch((err) => {
    q.emit('error', err)
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
