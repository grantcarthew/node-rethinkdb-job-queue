const util = require('util')
const EventEmitter = require('events').EventEmitter
const moment = require('moment')
const dbJob = require('./db-job')

function Job (queue, data, options) {
  if (!new.target) {
    return new Job(queue, data, options)
  }

  this.q = queue
  this.data = data || {}
  this.progress = 0
  this.retryCount = 0
  this.retryDelay = options.retryDelay || 0
  this.retryMax = options.retryMax > 0 ? options.retryMax : 0
  this.timeout = options.timeout > 0 ? options.timeout : 0
  this.status = this.statuses.created
  this.log = []
  this.dateCreated = moment().toString()
  this.dateModified = moment().toString()
  this.dateFailed = ''
  this.dateStarted = ''
  this.duration = ''
  this.priority = options.priority || this.priorities.nomal
  this.workerId = ''
}
util.inherits(Job, EventEmitter)

Job.prototype.priorities = {
  lowest: 10, low: 20, normal: 30, medium: 40, high: 50, highest: 60
}

Job.prototype.statuses = {
  created: 'created',
  delayed: 'delayed',
  active: 'active',
  waiting: 'waiting',
  complete: 'complete',
  failed: 'failed',
  retry: 'retry'
}

Job.prototype.generalize = function () {
  const jobCopy = Object.assign({}, this)
  delete jobCopy.queue
  delete jobCopy.id
  return jobCopy
}

Job.prototype.progress = function (complete, total, data) {
  // if (0 == arguments.length) return this.progress
  // var n = Math.min(100, complete * 100 / total | 0);
  // this.set('progress', n);

  // // If this stringify fails because of a circular structure, even the one in events.emit would.
  // // So it does not make sense to try/catch this.
  // if( data ) this.set('progress_data', JSON.stringify(data));

  // this.set('updated_at', Date.now());
  // this.refreshTtl();
  // events.emit(this.id, 'progress', n, data);
  // return this;
  // // right now we just send the pubsub event
  // // might consider also updating the job hash for persistence
  // cb = cb || helpers.defaultCb
  // progress = Number(progress)
  // if (progress < 0 || progress > 100) {
  //   return process.nextTick(cb.bind(null, Error('Progress must be between 0 and 100')))
  // }
  // this.progress = progress
  // this.queue.client.publish(this.queue.toKey('events'), JSON.stringify({
  //   id: this.id,
  //   event: 'progress',
  //   data: progress
  // }), cb)
}

Job.prototype.complete = function () {
  this.progress = 100
  this.status = this.statuses.complete
};

Job.prototype.failed = function () {
  this.status = this.statuses.failed
}

Job.prototype.waiting = function () {
  this.status = this.statuses.waiting
}

Job.prototype.active = function () {
  this.status = this.statuses.active
}

Job.prototype.delayed = function () {
  this.status = this.statuses.delayed
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

}

module.exports = Job
