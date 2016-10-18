const logger = require('./logger')(module)
const uuid = require('uuid')
const enums = require('./enums')
const is = require('./is')
const jobOptions = require('./job-options')
const jobProgress = require('./job-progress')
const jobUpdate = require('./job-update')
const jobAddLog = require('./job-add-log')

class Job {

  constructor (q, jobData) {
    logger('constructor')
    logger('queue id', q.id)
    logger('jobData', jobData)
    this.q = q

    if (is.job(jobData)) {
      logger('Creating job from database object')
      Object.assign(this, jobData)
      this.priority = enums.priorityFromValue(this.priority)
    } else {
      logger('Creating new job from defaults')

      const options = jobOptions()
      const now = new Date()
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
      this.dateEnable = now
      this.dateStarted
      this.dateFinished
      this.queueId = q.id
      // Conflicting job options will be overwritten.
      if (is.function(jobData)) {
        throw new Error(enums.message.jobDataInvalid)
      }
      if (is.array(jobData) || !is.object(jobData)) {
        this.data = jobData
      } else {
        Object.assign(this, jobData)
      }
    }
  }

  setPriority (newPriority) {
    if (Object.keys(enums.priority).includes(newPriority)) {
      this.priority = newPriority
      return this
    }
    throw new Error(enums.message.priorityInvalid)
  }

  setTimeout (newTimeout) {
    if (is.integer(newTimeout) &&
        newTimeout >= 0) {
      this.timeout = newTimeout
      return this
    }
    throw new Error(enums.message.timeoutIvalid)
  }

  setRetryMax (newRetryMax) {
    if (is.integer(newRetryMax) &&
        newRetryMax >= 0) {
      this.retryMax = newRetryMax
      return this
    }
    throw new Error(enums.message.retryMaxIvalid)
  }

  setRetryDelay (newRetryDelay) {
    if (is.integer(newRetryDelay) &&
        newRetryDelay >= 0) {
      this.retryDelay = newRetryDelay
      return this
    }
    throw new Error(enums.message.retryDelayIvalid)
  }

  setDateEnable (newDateEnable) {
    if (is.date(newDateEnable)) {
      this.dateEnable = newDateEnable
      return this
    }
    throw new Error(enums.message.dateEnableIvalid)
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

  update () {
    logger(`update`)
    return this.q.ready().then(() => {
      return jobUpdate(this)
    }).catch((err) => {
      logger('update Error:', err)
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

  addLog (data = {},
          message = enums.message.seeLogData,
          type = enums.log.information,
          status = this.status) {
    logger('addLog', data, message, type, status)
    return this.q.ready().then(() => {
      return jobAddLog.commitLog(this, data, message, type, status)
    }).catch((err) => {
      logger('addLog Error:', err)
      this.q.emit(enums.status.error, err)
      return Promise.reject(err)
    })
  }

  getLastLog () {
    return jobAddLog.getLastLog(this)
  }
}

module.exports = Job
