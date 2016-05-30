const Promise = require('bluebird')
const moment = require('moment')
const jobHeartbeat = require('./job-heartbeat')

const jobRun = function (q, job) {

  return new Promise((resolve, reject) => {
    //job.startHeartbeat()
  })
}

const jobTick = function (q) {
  if (q.paused) {
    return
  }

  return q.getNextJob().then((jobsToDo) => {
    console.log('0000000000000 you what?')
    console.dir(jobsToDo)
    q.running += 1
    if (q.running < q.concurrency) {
      setImmediate(jobTick, q)
    }

    return jobRun(q, jobsToDo)
  }).then((jobRunResult) => {
    q.emit(
      jobRunResult.status,
      jobRunResult.job,
      jobRunResult.result
    )
    return setImmediate(jobTick, q)
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
