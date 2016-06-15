const logger = require('./logger')(module)
const EventEmitter = require('events').EventEmitter
const rethinkdbdash = require('rethinkdbdash')
const Promise = require('bluebird')
const enums = require('./enums')
const Job = require('./job')
const dbAssert = require('./db-assert')
const dbReview = require('./db-review')
const queueProcess = require('./queue-process')
const queueChange = require('./queue-change')
const queueAddJob = require('./queue-add-job')
const queueGetJob = require('./queue-get-job')
const queueGetNextJob = require('./queue-get-next-job')
const queueRemoveJob = require('./queue-remove-job')
const queueReset = require('./queue-reset')
const queueStatusSummary = require('./queue-status-summary')
const queueStop = require('./queue-stop')
const queueDelete = require('./queue-delete')
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
    this.isMaster = options.isMaster == null ? false
      : options.isMaster
    this.masterReviewPeriod = options.masterReviewPeriod || 300
    this.isWorker = options.isWorker == null ? false
      : options.isWorker
    this.concurrency = options.concurrency > 1 ? options.concurrency : 1
    this.running = 0
    this._jobDefaultOptions = jobOptions()
    this._changeFeed = false
    this.removeOnSuccess = options.removeOnSuccess == null ? false
      : options.removeOnSuccess
    this.paused = false
    this.id = [
      require('os').hostname(),
      this.db,
      this.name,
      process.pid
    ].join(':')
    this.attachToDb()
  }

  attachToDb () {
    this.r = rethinkdbdash({
      host: this.host,
      port: this.port,
      db: this.db
      // silent: true TODO: Reinstate
    })
    this.ready = dbAssert(this).then(() => {
      return this.r.db(this.db).table(this.name).changes().run()
    }).then((changeFeed) => {
      this._changeFeed = changeFeed
      this._changeFeed.each((err, change) => {
        queueChange(this, err, change)
      })
      if (this.isMaster) {
        logger('Queue is a master')
        dbReview.start(this)
      }
      this.emit(enums.queueStatus.ready)
    })
  }

  detachFromDb (drainPool) {
    return Promise.resolve()
    .then(() => {
      if (this._changeFeed) {
        this._changeFeed.close()
        this._changeFeed = false
      }
      dbReview.stop(this)
      if (drainPool) {
        this.ready = false
        return this.r.getPoolMaster().drain()
      }
      return null
    }).then(() => {
      this.emit(enums.queueStatus.detached)
      return null
    })
  }

  get connection () {
    logger('get connection')
    return this.r
  }

  get jobDefaultOptions () {
    logger('get jobDefaultOptions')
    return this._jobDefaultOptions
  }

  set jobDefaultOptions (options) {
    logger('set jobDefaultOptions')
    this._jobDefaultOptions = jobOptions(options)
  }

  createJob (data, options = this._jobDefaultOptions, quantity = 1) {
    logger('createJob')
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
      return queueProcess(this, handler)
    })
  }

  getStatusSummary () {
    logger('getStatusSummary')
    return this.ready.then(() => {
      return queueStatusSummary(this)
    })
  }

  reset () {
    logger('reset')
    return this.ready.then(() => {
      return queueReset(this)
    })
  }

  stop (stopTimeout, drainPool) {
    if (!stopTimeout) { throw new Error(enums.error.missingTimeout) }
    logger('stop')
    return queueStop(this, stopTimeout)
  }

  delete (deleteTimeout) {
    logger('delete')
    if (!deleteTimeout) { throw new Error(enums.error.missingTimeout) }
    return queueDelete(this, deleteTimeout)
  }
}

module.exports = Queue
