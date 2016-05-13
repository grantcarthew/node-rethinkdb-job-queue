const util = require('util')
const EventEmitter = require('events').EventEmitter
const uuid = require('node-uuid')
const moment = require('moment')
const dbQueue = require('./db-queue')

function Job (data, options) {
  if (!new.target) {
    return new Job(data, options)
  }

  options = options || {}
  // If creating a job from the database, pass the job data as the options.
  // Eg. new Job(null, jobData)
  if (options.id) {
    Object.assign(this, options)
  } else {
    this.id = uuid.v4()
    this.data = data || {}
    this.progress = 0
    this.retryCount = 0
    this.retryDelay = options.retryDelay || 0
    this.retryMax = options.retryMax > 0 ? options.retryMax : 0
    this.timeout = options.timeout > 0 ? options.timeout : 0
    this.status = 'created'
    this.log = []
    this.dateCreated = moment().toString()
    this.dateModified = moment().toString()
    this.dateFailed = ''
    this.dateStarted = ''
    this.duration = ''
    this.priority = options.priority || 'normal'
    this.workerId = ''
  }
}
util.inherits(Job, EventEmitter)

Job.prototype.setStatus = function (status) {
  this.status = status
}

Job.prototype.remove = function () {
  return dbQueue.removeJob(this)
}

Job.prototype.retry = function (cb) {

}

module.exports = Job
