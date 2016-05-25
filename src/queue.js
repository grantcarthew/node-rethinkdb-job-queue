const EventEmitter = require('events').EventEmitter
const rethinkdbdash = require('rethinkdbdash')
const Promise = require('bluebird')
const async = Promise.coroutine
const logger = require('./logger')
const Job = require('./job')
const dbAssert = require('./db-assert')
const dbQueue = require('./db-queue')
const queueMessages = require('./queue-messages')
const dbReview = require('./db-review')
const jobProcess = require('./job-process')

class Queue extends EventEmitter {

  constructor (options, debug) {
    super()
    if (debug && debug === 'enabled') { process.env.rjqDEBUG = 'enabled' }
    logger('Queue Constructor')

    this.id = [ 'rethinkdb-job-queue', require('os').hostname(), process.pid ].join(':')
    options = options || {}
    this.host = options.host || 'localhost'
    this.port = options.port || 28015
    this.db = options.db || 'rjqJobQueue'
    this.r = rethinkdbdash({
      host: this.host,
      port: this.port,
      db: this.db
    })
    this.onChange = queueMessages
    this.name = options.name || 'rjqJobList'
    this.isWorker = options.isWorker || true
    this.concurrency = options.concurrency || 1
    this.jobTimeout = options.jobTimeout || 120
    this.removeOnSuccess = options.removeOnSuccess || true
    this.catchExceptions = options.catchExceptions || true
    this.paused = false
    this.ready = async(function * () {
      yield dbAssert.database(this)
      yield dbAssert.table(this)
      yield dbAssert.index(this)
      if (this.isWorker) {
        yield dbQueue.registerQueueChangeFeed(this)
        dbReview.start(this)
      }
      this.emit('ready')
    }).bind(this)()
  }

  get connection () {
    return this.r
  }

  createJob (data, options) {
    return new Job(data, options)
  }

  addJob (job) {
    return this.ready.then(() => {
      return dbQueue.addJob(this, job)
    })
  }

  getJob (jobId) {
    return this.ready.then(() => {
      return dbQueue.getById(this, jobId)
    })
  }

  setJobStatus (status) {
    dbQueue.setStatus(this.status, status).then((statusResult) => {
      console.log('STATUS RESULT++++++++++++++++++++++++++++++++++++++')
      console.dir(statusResult)
    })
  }

  getNextJob () {
    return this.ready.then(() => {
      return dbQueue.getNextJob(this)
    })
  }

  process (handler, concurrency) {
    return this.ready.then(() => {
      return jobProcess(this, handler, concurrency)
    })
  }

  get statusSummary () {
    return this.ready.then(() => {
      return dbQueue.statusSummary(this)
    })
  }

  close () {
    this.paused = true
    dbReview.stop(this)
    return this.r.getPoolMaster().drain()
  }

  delete () {
    return this.ready.then(() => {
      return dbQueue.deleteQueue(this)
    }).then(() => {
      this.ready = Promise.reject('Queue has been deleted')
    })
  }

}

module.exports = Queue
