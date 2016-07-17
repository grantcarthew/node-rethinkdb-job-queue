const logger = require('./logger')(module)
const uuid = require('node-uuid')
const moment = require('moment')
const enums = require('./enums')
const jobOptions = require('./job-options')
const jobProgress = require('./job-progress')
const jobAddLog = require('./job-add-log')

class Job {

  constructor (q, data, options) {
    logger('constructor')
    logger('queue id', q.id)
    logger('data', data)
    logger('options', options)
    this.q = q

    // If creating a job from the database, pass the job data as the options.
    // Eg. new Job(queue, null, data)
    if (options && options.id) {
      logger('Creating job from database object')
      Object.assign(this, options)
      this.priority = enums.priorityFromValue(this.priority)
    } else {
      logger('Creating new job from defaults and options')
      if (!options) {
        options = jobOptions()
      } else {
        options = jobOptions(options)
      }
      const now = moment().toDate()
      this.id = uuid.v4()
      this.data = data || {}
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

  setProgress (percent) {
    logger(`setProgress [${percent}]`)
    return this.q.ready.then(() => {
      return jobProgress(this, percent)
    })
  }

  getCleanCopy () {
    logger('getCleanCopy')
    const jobCopy = Object.assign({}, this)
    jobCopy.priority = enums.priority[jobCopy.priority]
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
    return this.q.ready.then(() => {
      return jobAddLog(this, log)
    })
  }
}

module.exports = Job
