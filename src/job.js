const logger = require('./logger')(module)
const uuid = require('node-uuid')
const moment = require('moment')
const enums = require('./enums')
const is = require('./is')
const jobOptions = require('./job-options')
const jobProgress = require('./job-progress')
const jobAddLog = require('./job-add-log')

class Job {

  constructor (q, options) {
    logger('constructor')
    logger('queue id', q.id)
    logger('options', options)
    this.q = q

    // If creating a job from the database, pass the job as options.
    // Eg. new Job(queue, jobFromDb)
    if (is.job(options)) {
      logger('Creating job from database object')
      Object.assign(this, options)
      this.priority = enums.priorityFromValue(this.priority)
    } else {
      logger('Creating new job from defaults and options')

      if (!options) {
        options = jobOptions()
      } else {
        options = jobOptions(this, options)
      }
      const now = moment().toDate()
      this.id = uuid.v4()
      this.priority = options.priority
      this.timeout = options.timeout
      this.retryDelay = options.retryDelay
      this.retryMax = options.retryMax
      this.retryCount = 0
      this.progress = 0
      this.status = enums.status.created
      this.log = []
      this.dateCreated = now
      this.dateRetry = now
      this.dateStarted
      this.dateFinished
      this.queueId = q.id
    }
  }

  setPayload (data) {
    this.payload = data
    return this
  }

  setProgress (percent) {
    logger(`setProgress [${percent}]`)
    return this.q.ready().then(() => {
      return jobProgress(this, percent)
    }).catch((err) => {
      logger('setProgress Error:', err)
      this.q.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  getCleanCopy (priorityAsString) {
    logger('getCleanCopy')
    const jobCopy = Object.assign({}, this)
    if (!priorityAsString) {
      jobCopy.priority = enums.priority[jobCopy.priority]
    }
    delete jobCopy.q
    return jobCopy
  }

  createLog (message, type = enums.log.information, status = this.status) {
    logger(`createLog [${message}] [${type}] [${status}]`)
    return {
      date: moment().toDate(),
      queueId: this.q.id,
      type: type,
      status: status,
      retryCount: this.retryCount,
      message: message
    }
  }

  addLog (log) {
    logger('addLog', log)
    return this.q.ready().then(() => {
      return jobAddLog(this, log)
    }).catch((err) => {
      logger('addLog Error:', err)
      this.q.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }
}

module.exports = Job
