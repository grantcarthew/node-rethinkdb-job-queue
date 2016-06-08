const logger = require('./logger')(module)
const uuid = require('node-uuid')
const moment = require('moment')
const enums = require('./enums')
const jobOptions = require('./job-options')

class Job {

  constructor (q, data, options) {
    logger('constructor')
    logger('queue id', q.id)
    logger('data', data)
    logger('options', options)
    this.q = q

    // If creating a job from the database, pass the job data as the options.
    // Eg. new Job(queue, null, jobData)
    if (options.id) {
      logger('Creating job from database object')
      Object.assign(this, options)
      this.priority = Object.keys(enums.priority)
        .find(key => enums.priority[key] === this.priority)
    } else {
      logger('Creating new job from defaults and options')
      options = jobOptions(options)
      this.id = uuid.v4()
      this.data = data || {}
      this.priority = options.priority
      this.timeout = options.timeout
      this.retryDelay = options.retryDelay
      this.retryMax = options.retryMax
      this.progress = 0
      this.retryCount = 0
      this.status = enums.jobStatus.created
      this.log = []
      this.dateCreated = moment().toDate()
      this.dateStarted
      this.dateCompleted
      this.dateTimeout
      this.dateFailed
      this.workerId
    }
  }

  get cleanCopy () {
    logger('cleanCopy')
    const jobCopy = Object.assign({}, this)
    jobCopy.priority = enums.priority[jobCopy.priority]
    delete jobCopy.q
    return jobCopy
  }

  addLogEntry (logEntry) {
    logger('addLogEntry', logEntry)
    if (this.status === enums.jobStatus.created) {
      return Promise.reject(enums.error.jobNotAdded)
    }
    return this.q.table(this.q.name)
    .get(this.id)
    .update({log: this.q.r.row('log').add([logEntry])})
  }
}

module.exports = Job
