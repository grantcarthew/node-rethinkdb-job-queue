const logger = require('./logger')(module)
const EventEmitter = require('events').EventEmitter
const uuid = require('uuid')
const Promise = require('bluebird')
const is = require('./is')
const enums = require('./enums')
const Job = require('./job')
const dbReview = require('./db-review')
const queueDb = require('./queue-db')
const queueProcess = require('./queue-process')
const queueAddJob = require('./queue-add-job')
const queueGetJob = require('./queue-get-job')
const queueInterruption = require('./queue-interruption')
const queueCancelJob = require('./queue-cancel-job')
const queueRemoveJob = require('./queue-remove-job')
const queueReset = require('./queue-reset')
const queueSummary = require('./queue-summary')
const queueStop = require('./queue-stop')
const queueDrop = require('./queue-drop')
const jobOptions = require('./job-options')

class Queue extends EventEmitter {

  constructor (cxn, options) {
    super()
    logger('Queue Constructor', options)

    options = options || {}
    this._name = options.name || enums.options.name
    this._r = false
    this._host = '' // Populated by 'queue-db.attach()'
    this._port = 0 // Populated by 'queue-db.attach()'
    this._db = '' // Populated by 'queue-db.attach()'
    this._masterInterval = options.masterInterval ||
      enums.options.masterInterval
    this._jobOptions = jobOptions()
    this._changeFeedCursor = false
    this._paused = false
    this._running = 0
    this._changeFeed = options.changeFeed == null
      ? true : options.changeFeed
    this._concurrency = options.concurrency > 1
      ? options.concurrency : enums.options.concurrency
    this._removeFinishedJobs = options.removeFinishedJobs == null
      ? enums.options.removeFinishedJobs : options.removeFinishedJobs
    this._handler = false
    this._id = [
      require('os').hostname(),
      this.db,
      this.name,
      process.pid,
      uuid.v4()
    ].join(':')
    queueDb.attach(this, cxn)
  }

  get name () { return this._name }
  get id () { return this._id }
  get host () { return this._host }
  get port () { return this._port }
  get db () { return this._db }
  get r () { return this._r }
  get changeFeed () { return this._changeFeed }
  get master () { return this._masterInterval > 0 }
  get masterInterval () { return this._masterInterval }
  get jobOptions () { return this._jobOptions }
  get removeFinishedJobs () { return this._removeFinishedJobs }
  get running () { return this._running }
  get concurrency () { return this._concurrency }
  get paused () { return this._paused }
  get idle () { return this._running < 1 }

  set jobOptions (options) {
    logger('set jobOptions', options)
    this._jobOptions = jobOptions(options, this._jobOptions)
  }

  set concurrency (value) {
    if (!is.integer(value) || value < 1) {
      this.emit(enums.status.error,
        new Error(enums.message.concurrencyInvalid),
        value)
      return
    }
    this._concurrency = value
  }

  createJob (options = this.jobOptions, quantity = 1) {
    logger('createJob', options, quantity)
    if (is.integer(options)) {
      quantity = options
      options = this.jobOptions
    }
    if (quantity > 1) {
      const jobs = []
      for (let i = 0; i < quantity; i++) {
        jobs.push(new Job(this, options))
      }
      return jobs
    }
    return new Job(this, options)
  }

  addJob (job) {
    logger('addJob', job)
    return this.ready().then(() => {
      return queueAddJob(this, job)
    }).catch((err) => {
      logger('addJob Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  getJob (jobOrId) {
    logger('getJob', jobOrId)
    return this.ready().then(() => {
      return queueGetJob(this, jobOrId)
    }).catch((err) => {
      logger('getJob Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  cancelJob (jobOrId, reason) {
    logger('cancelJob', jobOrId, reason)
    return this.ready().then(() => {
      return queueCancelJob(this, jobOrId, reason)
    }).catch((err) => {
      logger('cancelJob Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  removeJob (jobOrId) {
    logger('removeJob', jobOrId)
    return this.ready().then(() => {
      return queueRemoveJob(this, jobOrId)
    }).catch((err) => {
      logger('removeJob Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  process (handler) {
    logger('process', handler)
    return this.ready().then(() => {
      return queueProcess.addHandler(this, handler)
    }).catch((err) => {
      logger('process Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  review () {
    logger('review')
    return this.ready().then(() => {
      return dbReview.runOnce(this)
    }).catch((err) => {
      logger('review Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  summary () {
    logger('summary')
    return this.ready().then(() => {
      return queueSummary(this)
    }).catch((err) => {
      logger('summary Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  ready () {
    logger('ready')
    return this._ready
  }

  pause () {
    logger(`pause`)
    return this.ready().then(() => {
      return queueInterruption.pause(this)
    }).catch((err) => {
      logger('pause Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  resume () {
    logger(`resume`)
    return this.ready().then(() => {
      return queueInterruption.resume(this)
    }).catch((err) => {
      logger('resume Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  reset () {
    logger('reset')
    return this.ready().then(() => {
      return queueReset(this)
    }).catch((err) => {
      logger('reset Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  stop () {
    logger('stop')
    return queueStop(this).catch((err) => {
      logger('stop Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  drop () {
    logger('drop')
    return queueDrop(this).catch((err) => {
      logger('drop Error:', err)
      this.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }
}

module.exports = Queue
