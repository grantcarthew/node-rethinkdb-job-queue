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
const queueFindJob = require('./queue-find-job')
const queueInterruption = require('./queue-interruption')
const queueCancelJob = require('./queue-cancel-job')
const queueReanimateJob = require('./queue-reanimate-job')
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

    // The following properties are Populated
    // by the queueDb.attach(this, cxn) call below.
    this._r = false
    this._host = ''
    this._port = 0
    this._db = ''
    this._id = ''
    this._ready = false

    this._queryRunOptions = options.queryRunOptions == null
      ? enums.options.queryRunOptions : options.queryRunOptions
    this._masterInterval = options.masterInterval == null
      ? enums.options.masterInterval : options.masterInterval
    this._databaseInitDelay = options.databaseInitDelay == null
      ? enums.options.databaseInitDelay : options.databaseInitDelay
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
    logger('set concurrency', value)
    if (!is.integer(value) || value < 1) {
      const err = new Error(enums.message.concurrencyInvalid)
      logger('Event: concurrency error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return
    }
    this._concurrency = value
  }

  createJob (jobData) {
    logger('createJob', jobData)
    jobData = jobData == null ? this.jobOptions : jobData
    return new Job(this, jobData)
  }

  addJob (job) {
    logger('addJob', job)
    return this.ready().then(() => {
      return queueAddJob(this, job)
    }).catch((err) => {
      logger('Event: addJob error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  getJob (jobOrId) {
    logger('getJob', jobOrId)
    return this.ready().then(() => {
      return queueGetJob(this, jobOrId)
    }).catch((err) => {
      logger('Event: getJob error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  findJob (predicate, raw) {
    logger('findJob', predicate)
    return this.ready().then(() => {
      return queueFindJob(this, predicate, raw)
    }).catch((err) => {
      logger('Event: findJob error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  cancelJob (jobOrId, reason) {
    logger('cancelJob', jobOrId, reason)
    return this.ready().then(() => {
      return queueCancelJob(this, jobOrId, reason)
    }).catch((err) => {
      logger('Event: cancelJob error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  reanimateJob (jobOrId, dateEnable) {
    logger('reanimateJob', jobOrId, dateEnable)
    return this.ready().then(() => {
      return queueReanimateJob(this, jobOrId, dateEnable)
    }).catch((err) => {
      logger('Event: reanimateJob error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  removeJob (jobOrId) {
    logger('removeJob', jobOrId)
    return this.ready().then(() => {
      return queueRemoveJob(this, jobOrId)
    }).catch((err) => {
      logger('Event: removeJob error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  process (handler) {
    logger('process', handler)
    return this.ready().then(() => {
      return queueProcess.addHandler(this, handler)
    }).catch((err) => {
      logger('Event: process error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  review () {
    logger('review')
    return this.ready().then(() => {
      return dbReview.runOnce(this)
    }).catch((err) => {
      logger('Event: review error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  summary () {
    logger('summary')
    return this.ready().then(() => {
      return queueSummary(this)
    }).catch((err) => {
      logger('Event: summary error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  ready () {
    logger('ready')
    return this._ready
  }

  pause (global) {
    logger(`pause`)
    return this.ready().then(() => {
      return queueInterruption.pause(this, global)
    }).catch((err) => {
      logger('Event: pause error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  resume (global) {
    logger(`resume`)
    return this.ready().then(() => {
      return queueInterruption.resume(this, global)
    }).catch((err) => {
      logger('Event: resume error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  reset () {
    logger('reset')
    return this.ready().then(() => {
      return queueReset(this)
    }).catch((err) => {
      logger('Event: reset error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  stop () {
    logger('stop')
    return queueStop(this).then(() => {
      return queueDb.drain(this)
    }).catch((err) => {
      logger('Event: stop error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }

  drop () {
    logger('drop')
    return queueDrop(this).catch((err) => {
      logger('Event: drop error', this.id, err)
      this.emit(enums.status.error, this.id, err)
      return Promise.reject(err)
    })
  }
}

module.exports = Queue
