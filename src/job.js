const util = require('util')
const EventEmitter = require('events').EventEmitter
const uuid = require('node-uuid')
const moment = require('moment')
const dbJob = require('./db-job')

function Job (data, options) {
  if (!new.target) {
    return new Job(data, options)
  }
  options = options || {}
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
util.inherits(Job, EventEmitter)

Job.prototype.setStatus = function (status) {
  this.status = status
}

Job.prototype.remove = function () {
  return dbJob.remove(this)
}

Job.prototype.retry = function (cb) {

}

module.exports = Job
