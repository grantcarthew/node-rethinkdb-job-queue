const events = require('events')
const util = require('util')
const moment = require('moment')
const dbJob = require('./db-job')

function Job (queue, data, options, template) {
  if (!new.target) {
    return new Job(queue, data, options)
  }

  this.queue = queue
  this.progress = 0
  this.retryCount = 0
  this.data = data || {}
  this.options = options || {}
  this.status = 'created'
  this.dateCreated = moment().toString()
  if (!template) {
    return dbJob.save(this).then((saveResult) => {
      this.id = saveResult.generated_keys[0]
      // self.queue.jobs[jobId] = self TODO: Remove
      return this
    })
  }
}

util.inherits(Job, events.EventEmitter)

Job.prototype.toData = function () {
  const jobCopy = Object.assign({}, this)
  delete jobCopy.queue
  delete jobCopy.id
  return jobCopy
}

Job.prototype.retries = function (n) {
  if (n < 0) {
    throw Error('Retries cannot be negative')
  }
  this.options.retries = n
  return this
}

Job.prototype.timeout = function (ms) {
  if (ms < 0) {
    throw Error('Timeout cannot be negative')
  }
  this.options.timeout = ms
  return this
}

Job.prototype.reportProgress = function (progress, cb) {
  // right now we just send the pubsub event
  // might consider also updating the job hash for persistence
  cb = cb || helpers.defaultCb
  progress = Number(progress)
  if (progress < 0 || progress > 100) {
    return process.nextTick(cb.bind(null, Error('Progress must be between 0 and 100')))
  }
  this.progress = progress
  this.queue.client.publish(this.queue.toKey('events'), JSON.stringify({
    id: this.id,
    event: 'progress',
    data: progress
  }), cb)
}

Job.prototype.setStatus = function (status) {
  dbJob.setStatus(this.status, status).then((statusResult) => {
    console.log('STATUS RESULT++++++++++++++++++++++++++++++++++++++')
    console.dir(statusResult)
  })
}

Job.prototype.remove = function () {
  return dbJob.remove(this)
}

Job.prototype.retry = function (cb) {
  cb = cb || helpers.defaultCb
  this.queue.client.multi()
    .srem(this.queue.toKey('failed'), this.id)
    .lpush(this.queue.toKey('waiting'), this.id)
    .exec(cb)
}

module.exports = Job
