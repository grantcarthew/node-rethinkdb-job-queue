const debug = require('debug')('job-process')
const Promise = require('bluebird')
const enums = require('./enums')
const dbReview = require('./db-review')
const dbQueue = require('./db-queue')
const dbJob = require('./db-job')

const jobRun = function (job) {
  debug('jobRun')
  let handled = false
  let heartbeatIntervalId = dbJob.startHeartbeat(job)
  let jobTimeoutId

  const nextHandler = (err, data) => {
    debug('nextHandler')
    console.dir(err)
    console.dir(data)
    // Ignore mulpiple calls to next()
    if (handled) { return }
    handled = true
    clearInterval(heartbeatIntervalId)
    clearTimeout(jobTimeoutId)
    job.q.running--
    let finalPromise
    if (err) {
      finalPromise = dbJob.failed(err, job, data)
    } else {
      finalPromise = dbJob.completed(job, data)
    }
    return finalPromise.then((finalResult) => {
      return setImmediate(jobTick, job.q)
    })
  }

  const timedOutMessage = 'Job ' + job.id + ' timed out (' + job.timeout + ' sec)'
  jobTimeoutId = setTimeout(nextHandler.bind(null, Error(timedOutMessage)), job.timeout * 1000)
  job.q.handler(job, nextHandler)
}

const jobTick = function (q) {
  debug('jobTick')
  if (q.paused) {
    return
  }

  return dbQueue.getNextJob(q).then((jobsToDo) => {
    if (jobsToDo.length < 1) {
      return Promise.reject(enums.queueStatus.idle)
    }
    return jobsToDo
  }).then((jobsToDo) => {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ jobsToDo ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
    jobsToDo.forEach((j) => { console.log(j.id) })
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~')
    for (let jobToDo of jobsToDo) {
      q.running++
      jobRun(jobToDo)
    }
    if (q.running < q.concurrency) {
      setImmediate(jobTick, q)
    }
    return
  }).catch((err) => {
    if (err === enums.queueStatus.idle) {
      debug('queue idle')
      q.emit(enums.queueStatus.idle)
      return
    }
    q.emit(enums.queueStatus.error, err.message)
    return setImmediate(jobTick, q)
  })
}

module.exports = function (q, handler) {
  debug('called')
  if (!q.isWorker) {
    throw Error('Cannot call process on a non-worker')
  }

  if (q.handler) {
    throw Error('Cannot call process twice')
  }

  q.handler = handler
  q.running = 0
  return dbReview.reviewStalledJobs(q).then((stallReviewResult) => {
    dbReview.start(q)
    setImmediate(jobTick, q)
    return true
  })
}
