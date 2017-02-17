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
const queueFindJobByName = require('./queue-find-job-by-name')
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

  _raiseQueueError (name) {
    const self = this
    return function raiseQueueErrorInternal (errObj) {
      const message = `Event: ${name} error`
      logger(message, self.id, errObj)
      self.emit(enums.status.error, self.id, errObj)
      return Promise.reject(errObj)
    }
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
      logger('concurrency', this.id, err)
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
    }).catch(this._raiseQueueError('addJob'))
  }

  getJob (jobOrId) {
    logger('getJob', jobOrId)
    return this.ready().then(() => {
      return queueGetJob(this, jobOrId)
    }).catch(this._raiseQueueError('getJob'))
  }

  findJob (predicate, raw) {
    logger('findJob', predicate, raw)
    return this.ready().then(() => {
      return queueFindJob(this, predicate, raw)
    }).catch(this._raiseQueueError('findJob'))
  }

  findJobByName (name, raw) {
    logger('findJobByName', name, raw)
    return this.ready().then(() => {
      return queueFindJobByName(this, name, raw)
    }).catch(this._raiseQueueError('findJobByName'))
  }

  containsJobByName (name) {
    logger('containsJobByName', name)
    return this.ready().then(() => {
      return queueFindJobByName(this, name, true)
    }).then((namedJobs) => {
      return namedJobs.length > 0
    }).catch(this._raiseQueueError('containsJobByName'))
  }

  cancelJob (jobOrId, reason) {
    logger('cancelJob', jobOrId, reason)
    return this.ready().then(() => {
      return queueCancelJob(this, jobOrId, reason)
    }).catch(this._raiseQueueError('cancelJob'))
  }

  reanimateJob (jobOrId, dateEnable) {
    logger('reanimateJob', jobOrId, dateEnable)
    return this.ready().then(() => {
      return queueReanimateJob(this, jobOrId, dateEnable)
    }).catch(this._raiseQueueError('reanimateJob'))
  }

  removeJob (jobOrId) {
    logger('removeJob', jobOrId)
    return this.ready().then(() => {
      return queueRemoveJob(this, jobOrId)
    }).catch(this._raiseQueueError('removeJob'))
  }

  process (handler) {
    logger('process', handler)
    return this.ready().then(() => {
      return queueProcess.addHandler(this, handler)
    }).catch(this._raiseQueueError('process'))
  }

  review () {
    logger('review')
    return this.ready().then(() => {
      return dbReview.runOnce(this)
    }).catch(this._raiseQueueError('review'))
  }

  summary () {
    logger('summary')
    return this.ready().then(() => {
      return queueSummary(this)
    }).catch(this._raiseQueueError('summary'))
  }

  ready () {
    logger('ready')
    return this._ready
  }

  pause (global) {
    logger(`pause`)
    return this.ready().then(() => {
      return queueInterruption.pause(this, global)
    }).catch(this._raiseQueueError('pause'))
  }

  resume (global) {
    logger(`resume`)
    return this.ready().then(() => {
      return queueInterruption.resume(this, global)
    }).catch(this._raiseQueueError('resume'))
  }

  reset () {
    logger('reset')
    return this.ready().then(() => {
      return queueReset(this)
    }).catch(this._raiseQueueError('reset'))
  }

  stop () {
    logger('stop')
    return queueStop(this).then(() => {
      return queueDb.drain(this)
    }).catch(this._raiseQueueError('stop'))
  }

  drop () {
    logger('drop')
    return queueDrop(this)
    .catch(this._raiseQueueError('drop'))
  }
}

module.exports = Queue
