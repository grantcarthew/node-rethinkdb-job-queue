const logger = require('./logger').init(module)
const uuid = require('node-uuid')
const moment = require('moment')
const priority = require('./enums').priority

class Job {

  constructor (q, data, options) {
    logger('constructor')
    this.q = q

    // If creating a job from the database, pass the job data as the options.
    // Eg. new Job(queue, null, jobData)
    if (options.id) {
      Object.assign(this, options)
    } else {
      let now = moment().toDate()
      this.id = uuid.v4()
      this.data = data || {}
      this.priority = options.priority
      this.timeout = options.timeout // TODO: populate.
      this.retryDelay = options.retryDelay
      this.retryMax = options.retryMax
      this.progress = 0
      this.retryCount = 0
      this.status = 'waiting'
      this.log = []
      this.dateCreated = now
      this.dateStarted
      this.dateCompleted
      this.dateHeartbeat = now
      this.heartbeatIntervalId
      this.dateStalled
      this.dateFailed
      this.workerId
    }
  }

  get cleanCopy () {
    logger('cleanCopy')
    const jobCopy = Object.assign({}, this)
    jobCopy.priority = priority[jobCopy.priority]
    delete jobCopy._events
    delete jobCopy._eventsCount
    delete jobCopy.domain
    delete jobCopy.q
    delete jobCopy.heardbeatIntervalId
    return jobCopy
  }
}

module.exports = Job
