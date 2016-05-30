const Promise = require('bluebird')
const moment = require('moment')
const jobHeartbeat = require('./job-heartbeat')
const dbQueue = require('./db-queue')
const dbJob = require('./db-job')

const jobResult = function (err, message) {
  
}

const jobRun = function (q, job) {
  return new Promise((resolve, reject) => {
    job.startHeartbeat()
    return dbJob.setStartedDate(q, job)
  }).then((startedUpdated) => {
    q.handle(job, jobResult)
  })
}

const jobTick = function (q) {
  if (q.paused) {
    return
  }

  return dbQueue.getNextJob(q).then((jobsToDo) => {
    if (jobsToDo.length < 1) {
      q.emit('idle')
      return
    }

    q.running++
    if (q.running < q.concurrency) {
      setImmediate(jobTick, q)
    }

    return jobRun(q, jobsToDo)
  }).catch((err) => {
    q.emit('error', err)
    return setImmediate(jobTick, q)
  })
}

const restartProcessing = function () {
  // maybe need to increment queued here?
  // self.bclient.once('ready', jobTick)
}

module.exports = function (q, handler) {
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

const preventStalling = () => {
  // Remove 'stalling' from the item.
  // if not handled, setTimeout
}

const handleOutcome = () => {

}
