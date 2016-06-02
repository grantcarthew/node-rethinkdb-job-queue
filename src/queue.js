const logger = require('./logger')(module)
const EventEmitter = require('events').EventEmitter
const rethinkdbdash = require('rethinkdbdash')
const Promise = require('bluebird')
const async = Promise.coroutine
const enums = require('./enums')
const Job = require('./job')
const dbAssert = require('./db-assert')
const dbQueue = require('./db-queue')
const queueMessages = require('./queue-messages')
const dbReview = require('./db-review')
const jobProcess = require('./job-process')
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
    this.r = rethinkdbdash({
      host: this.host,
      port: this.port,
      db: this.db
    })
    this.onChange = queueMessages
    this.isMaster = options.isMaster || true
    this.masterReviewPeriod = options.masterReviewPeriod || 300
    this.isWorker = options.isWorker || true
    this.concurrency = options.concurrency > 1 ? options.concurrency : 1
    this.running = 0
    this._jobDefaultOptions = jobOptions()
    this.removeOnSuccess = options.removeOnSuccess || true
    this.paused = false
    this.id = [
      require('os').hostname(),
      this.db,
      this.name,
      process.pid
    ].join(':')

    this.ready = async(function * () {
      yield dbAssert.database(this)
      yield dbAssert.table(this)
      yield dbAssert.index(this)
      yield dbQueue.registerQueueChangeFeed(this)
      if (this.isMaster) {
        dbReview.start(this)
      }
      this.emit(enums.queueStatus.ready)
    }).bind(this)()
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

  createJob (data, options = this._jobDefaultOptions) {
    logger('createJob')
    return new Job(this, data, options)
  }

  addJob (job) {
    logger('addJob')
    return this.ready.then(() => {
      return dbQueue.addJob(this, job)
    })
  }

  getJob (jobId) {
    logger('getJob')
    return this.ready.then(() => {
      return dbQueue.getJobById(this, jobId)
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
      return jobProcess(this, handler)
    })
  }

  getStatusSummary () {
    logger('getStatusSummary')
    return this.ready.then(() => {
      return dbQueue.statusSummary(this)
    })
  }

  close () {
    logger('close')
    this.paused = true
    dbReview.stop(this)
    return this.r.getPoolMaster().drain()
  }

  delete () {
    logger('delete')
    return this.ready.then(() => {
      return dbQueue.deleteQueue(this)
    }).then(() => {
      this.ready = Promise.reject('Queue has been deleted')
    })
  }
}

module.exports = Queue
