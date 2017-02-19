const logger = require('./logger')(module)
const uuid = require('uuid')
const enums = require('./enums')
const is = require('./is')
const errorBooster = require('./error-booster')
const jobOptions = require('./job-options')
const jobProgress = require('./job-progress')
const jobUpdate = require('./job-update')
const jobLog = require('./job-log')

class Job {

  constructor (q, jobData) {
    logger('constructor')
    logger('queue id', q.id)
    logger('jobData', jobData)
    this.q = q

    if (is.job(jobData)) {
      logger('Creating job from data')
      Object.assign(this, jobData)
      this.priority = enums.priorityFromValue(this.priority)
    } else {
      logger('Creating new job from defaults')

      const options = jobOptions()
      const now = new Date()
      const newId = uuid.v4()
      this.id = newId
      this.name = options.name || newId
      this.priority = options.priority
      this.timeout = options.timeout
      this.retryDelay = options.retryDelay
      this.retryMax = options.retryMax
      this.retryCount = 0
      this.repeat = options.repeat
      this.repeatDelay = options.repeatDelay
      this.processCount = 0
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

  setName (newName) {
    if (is.string(newName)) {
      this.name = newName
      return this
    }
    throw new Error(enums.message.nameInvalid)
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

  setRepeat (newRepeat) {
    if (is.boolean(newRepeat) || (
        is.integer(newRepeat) && newRepeat >= 0)) {
      this.repeat = newRepeat
      return this
    }
    throw new Error(enums.message.repeatInvalid)
  }

  setRepeatDelay (newRepeatDelay) {
    if (is.integer(newRepeatDelay) && newRepeatDelay >= 0) {
      this.repeatDelay = newRepeatDelay
      return this
    }
    throw new Error(enums.message.repeatDelayInvalid)
  }

  setDateEnable (newDateEnable) {
    if (is.date(newDateEnable)) {
      this.dateEnable = newDateEnable
      return this
    }
    throw new Error(enums.message.dateEnableIvalid)
  }

  updateProgress (percent) {
    logger(`updateProgress [${percent}]`)
    return this.q.ready().then(() => {
      return jobProgress(this, percent)
    }).catch(errorBooster(this, logger, 'updateProgress'))
  }

  update () {
    logger(`update`)
    return this.q.ready().then(() => {
      return jobUpdate(this)
    }).catch(errorBooster(this, logger, 'update'))
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
      return jobLog.commitLog(this, data, message, type, status)
    }).catch(errorBooster(this, logger, 'addLog'))
  }

  getLastLog () {
    return jobLog.getLastLog(this)
  }
}

module.exports = Job
