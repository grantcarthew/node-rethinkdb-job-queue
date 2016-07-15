const logger = require('./logger')(module)
const EventEmitter = require('events').EventEmitter
const Promise = require('bluebird')
const is = require('./is')
const enums = require('./enums')
const Job = require('./job')
const dbReview = require('./db-review')
const queueDb = require('./queue-db')
const queueProcess = require('./queue-process')
const queueAddJob = require('./queue-add-job')
const queueGetJob = require('./queue-get-job')
const queueCancelJob = require('./queue-cancel-job')
const queueRemoveJob = require('./queue-remove-job')
const queueReset = require('./queue-reset')
const queueSummary = require('./queue-summary')
const queueStop = require('./queue-stop')
const queueDrop = require('./queue-drop')
const jobOptions = require('./job-options')

class Queue extends EventEmitter {

  constructor (options) {
    super()
    logger('Queue Constructor', options)

    options = options || {}
    this.name = options.name || 'rjqJobList'
    this.host = options.host || 'localhost'
    this.port = options.port || 28015
    this.db = options.db || 'rjqJobQueue'
    this.isMaster = options.isMaster == null ? true
      : options.isMaster
    this.masterReviewPeriod = options.masterReviewPeriod || 310
    this.enableChangeFeed = options.enableChangeFeed == null
      ? true : options.enableChangeFeed
    this.concurrency = options.concurrency > 1 ? options.concurrency : 1
    this.removeFinishedJobs = options.removeFinishedJobs == null
      ? 180 : options.removeFinishedJobs
    this.handler = false
    this._running = 0
    this._jobOptions = jobOptions()
    this._changeFeed = false
    this._paused = false
    this.id = [
      require('os').hostname(),
      this.db,
      this.name,
      process.pid
    ].join(':')
    queueDb.attach(this)
  }

  pause () {
    logger(`pause`)
    return new Promise((resolve, reject) => {
      this._paused = true
      if (this._running < 1) { return resolve(true) }
      const q = this
      let intId = setInterval(function pausing () {
        logger(`Pausing, waiting on running jobs: [${q._running}]`)
        if (q._running < 1) {
          clearInterval(intId)
          resolve(true)
        }
      }, 400)
    }).then(() => {
      logger(`Event: paused [${this.id}]`)
      this.emit(enums.status.paused, this.id)
    })
  }

  get paused () {
    logger(`get paused`)
    return this._paused
  }

  resume () {
    logger(`resume`)
    return this.ready.then(() => {
      this._paused = false
      queueProcess.restart(this)
      logger(`Event: resumed [${this.id}]`)
      this.emit(enums.status.resumed, this.id)
      return true
    })
  }

  get connection () {
    logger('get connection')
    return this.r
  }

  get jobOptions () {
    logger('get jobOptions')
    return this._jobOptions
  }

  set jobOptions (options) {
    logger('set jobOptions', options)
    this._jobOptions = jobOptions(options)
  }

  createJob (data, options = this._jobOptions, quantity = 1) {
    logger('createJob', data, options, quantity)
    if (is.integer(options)) {
      quantity = options
      options = this._jobOptions
    }
    if (quantity > 1) {
      const jobs = []
      for (let i = 0; i < quantity; i++) {
        jobs.push(new Job(this, data, options))
      }
      return jobs
    }
    return new Job(this, data, options)
  }

  addJob (job) {
    logger('addJob', job)
    return this.ready.then(() => {
      return queueAddJob(this, job)
    })
  }

  cancelJob (job, reason) {
    logger('cancelJob', job, reason)
    return this.ready.then(() => {
      return queueCancelJob(this, job, reason)
    })
  }

  removeJob (job) {
    logger('removeJob', job)
    return this.ready.then(() => {
      return queueRemoveJob(this, job)
    })
  }

  getJob (jobId) {
    logger('getJob', jobId)
    return this.ready.then(() => {
      return queueGetJob(this, jobId)
    })
  }

  get jobConcurrency () {
    logger('get jobConcurrency')
    return this.concurrency
  }

  set jobConcurrency (newConcurrencyValue) {
    logger('set jobConcurrency', newConcurrencyValue)
    this.concurrency = newConcurrencyValue > 1 ? newConcurrencyValue : 1
  }

  process (handler) {
    logger('process', handler)
    return this.ready.then(() => {
      return queueProcess.addHandler(this, handler)
    })
  }

  get running () {
    logger(`get running`)
    return this._running
  }

  review () {
    logger('review')
    return this.ready.then(() => {
      return dbReview.runOnce(this)
    })
  }

  get idle () {
    logger(`get idle`)
    return this._running < 1
  }

  summary () {
    logger('summary')
    return this.ready.then(() => {
      return queueSummary(this)
    })
  }

  reset () {
    logger('reset')
    return this.ready.then(() => {
      return queueReset(this)
    })
  }

  stop () {
    logger('stop')
    return queueStop(this)
  }

  drop () {
    logger('drop')
    return queueDrop(this)
  }
}

module.exports = Queue
