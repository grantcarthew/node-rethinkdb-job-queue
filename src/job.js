const logger = require('./logger')(module)
const uuid = require('node-uuid')
const moment = require('moment')
const enums = require('./enums')
const jobOptions = require('./job-options')

class Job {

  constructor (q, data, options) {
    logger('constructor')
    this.q = q

    // If creating a job from the database, pass the job data as the options.
    // Eg. new Job(queue, null, jobData)
    if (options.id) {
      Object.assign(this, options)
    } else {
      options = jobOptions(options)
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
    jobCopy.priority = enums.priority[jobCopy.priority]
    delete jobCopy.q
    //delete jobCopy.heardbeatIntervalId
    return jobCopy
  }

  // get status () {
  //   return this._status
  // }
  //
  // set status (newStatus) {
  //   const startHeartbeat = () => {
  //     logger('startHeartbeat')
  //     this.heartbeatIntervalId = setInterval((job) => {
  //       logger('Heartbeat: ' + job.id)
  //       return job.q.r.table(job.q.name).get(job.id)
  //         .update({ dateHeartbeat: moment().toDate() }).run()
  //     }, 1000, this)
  //     // TODO: reinstate this line.
  //     // , job.timeout * 1000 / 2, job)
  //   }
  //
  //   if (newStatus === enums.jobStatus.active) {
  //     startHeartbeat()
  //   } else {
  //     clearInterval(this.heartbeatIntervalId)
  //   }
  // }

  // startHeartbeat () {
  //   logger('startHeartbeat')
  //   this.heartbeatIntervalId = setInterval((job) => {
  //     logger('Heartbeat: ' + job.id)
  //     return job.q.r.table(job.q.name).get(job.id)
  //       .update({ dateHeartbeat: moment().toDate() }).run()
  //   }, 1000, this)
  //   // TODO: reinstate this line.
  //   // , job.timeout * 1000 / 2, job)
  // }
  //
  // stopHeartbeat () {
  //   clearInterval(this.heartbeatIntervalId)
  // }
}

module.exports = Job
