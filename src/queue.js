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
    this.removeJobHistory = options.removeJobHistory == null
      ? 6 : options.removeJobHistory
    this.handler = false
    this.running = 0
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
    this._paused = true
    this.emit(enums.status.paused)
  }

  get paused () {
    return this._paused
  }

  resume () {
    this._paused = false
    return this.ready.then(() => {
      queueProcess.restart(this)
      this.emit(enums.status.resumed)
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
    logger('set jobOptions')
    this._jobOptions = jobOptions(options)
  }

  createJob (data, options = this._jobOptions, quantity = 1) {
    logger('createJob')
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
    logger('addJob')
    return this.ready.then(() => {
      return queueAddJob(this, job)
    })
  }

  cancelJob (job, reason) {
    logger('cancelJob')
    return this.ready.then(() => {
      return queueCancelJob(this, job, reason)
    })
  }

  removeJob (job) {
    logger('removeJob')
    return this.ready.then(() => {
      return queueRemoveJob(this, job)
    })
  }

  getJob (jobId) {
    logger('getJob')
    return this.ready.then(() => {
      return queueGetJob(this, jobId)
    })
  }

  get jobConcurrency () {
    logger('get jobConcurrency')
    return this.concurrency
  }

  set jobConcurrency (newConcurrencyValue) {
    logger('set jobConcurrency')
    this.concurrency = newConcurrencyValue > 1 ? newConcurrencyValue : 1
  }

  process (handler) {
    logger('process')
    return this.ready.then(() => {
      return queueProcess.addHandler(this, handler)
    })
  }

  review () {
    logger('review')
    return this.ready.then(() => {
      return dbReview.runOnce(this)
    })
  }

  get idle () {
    return this.running < 1
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

  stop (stopTimeout) {
    logger('stop')
    if (!stopTimeout) { throw new Error(enums.error.missingTimeout) }
    return queueStop(this, stopTimeout)
  }

  drop (dropTimeout) {
    logger('drop')
    if (!dropTimeout) { throw new Error(enums.error.missingTimeout) }
    return queueDrop(this, dropTimeout)
  }
}

module.exports = Queue
