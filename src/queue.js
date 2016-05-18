const EventEmitter = require('events').EventEmitter
const rethinkdbdash = require('rethinkdbdash')
const Promise = require('bluebird')
const async = Promise.coroutine
const logger = require('./logger')
const enums = require('./enums')
const Job = require('./job')
const dbAssert = require('./db-assert')
const dbQueue = require('./db-queue')
const messages = require('./messages')

class Queue extends EventEmitter {

  constructor (options, debug) {
    super()
    if (debug && debug === 'enabled') { process.env.rjqDEBUG = 'enabled' }
    logger('Queue Constructor')

    this.id = [ 'rethinkdb-job-queue', require('os').hostname(), process.pid ].join(':')
    options = options || {}
    this.host = options.host || 'localhost'
    this.port = options.port || 28015
    this.db = options.db || 'rjqJobQueue'
    this.r = rethinkdbdash({
      host: this.host,
      port: this.port,
      db: this.db
    })
    this.onChange = messages.onQueueChange
    this.heartBeatInterval = typeof options.heartBeatInterval === 'number'
        ? options.heartBeatInterval : 30
    this.name = options.name || 'rjqJobList'
    this.isWorker = options.isWorker || true
    this.removeOnSuccess = options.removeOnSuccess || true
    this.catchExceptions = options.catchExceptions || true
    this.paused = false
    this.ready = async(function * () {
      yield dbAssert.database(this)
      yield dbAssert.table(this)
      yield dbAssert.index(this)
      if (this.isWorker) {
        yield dbQueue.registerQueueChangeFeed(this)
      }
      this.emit('ready')
    }).bind(this)()
  }

  get connection () {
    return this.r
  }

  createJob (data, options) {
    return new Job(data, options)
  }

  addJob (job) {
    return this.ready.then(() => {
      return dbQueue.addJob(this, job)
    })
  }

  getJob (jobId) {
    return this.ready.then(() => {
      return dbQueue.getById(this, jobId)
    })
  }

  getNextJob () {
    return this.ready.then(() => {
      return dbQueue.getNextJob(this)
    })
  }

  delete () {
    return this.ready.then(() => {
      return dbQueue.deleteQueue(this)
    }).then(() => {
      this.ready = Promise.reject('Queue has been deleted')
    })
  }

}

Queue.prototype.process = function (concurrency, handler) {
  if (!this.isWorker) {
    throw Error('Cannot call Queue.prototype.process on a non-worker')
  }

  if (this.handler) {
    throw Error('Cannot call Queue.prototype.process twice')
  }

  if (typeof concurrency === 'function') {
    handler = concurrency
    concurrency = 1
  }

  let self = this
  this.handler = handler
  this.running = 0
  this.queued = 1
  this.concurrency = concurrency

  let jobTick = () => {
    if (self.paused) {
      self.queued -= 1
      return
    }

    // invariant: in this code path, self.running < self.concurrency, always
    // after spoolup, self.running + self.queued === self.concurrency
    this.getNextJob().then((nextJob) => {
      this.running += 1
      this.queued -= 1
      if (this.running + this.queued < this.concurrency) {
        this.queued += 1
        setImmediate(jobTick)
      }

      this.runJob((jobRunResult) => {
        this.emit(
          jobRunResult.status,
          jobRunResult.job,
          jobRunResult.result
        )
        return setImmediate(jobTick)
      }).catch((err) => {
        this.emit('error', err)
      })
    }).catch((err) => {
      this.emit('error', err)
      return setImmediate(jobTick)
    })
  }

  let restartProcessing = function () {
    // maybe need to increment queued here?
    //self.bclient.once('ready', jobTick)
  }
  //this.bclient.on('error', restartProcessing)
  //this.bclient.on('end', restartProcessing)

  //this.checkStalledJobs(setImmediate.bind(null, jobTick))
}

Queue.prototype.checkStalledJobs = function (interval, cb) {
  var self = this
  cb = typeof interval === 'function' ? interval : cb// || helpers.defaultCb

  this.client.evalsha(dbQueue.checkStalledJobs, 4,
    this.toKey('stallTime'), this.toKey('stalling'), this.toKey('waiting'), this.toKey('active'),
    Date.now(), this.options.stallInterval * 1000, function (err) {
      /* istanbul ignore if */
      if (err) return cb(err)

      if (typeof interval === 'number') {
        setTimeout(self.checkStalledJobs.bind(self, interval, cb), interval)
      }

      return cb()
    }
  )
}



Queue.prototype.progress = function (complete, total, data) {
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

Queue.prototype.close = function (cb) {
  this.paused = true
  return this.r.getPoolMaster().drain()
}

Queue.prototype.destroy = function (cb) {
  cb = cb || helpers.defaultCb
  var keys = ['id', 'jobs', 'stallTime', 'stalling', 'waiting', 'active', 'succeeded', 'failed']
    .map(this.toKey.bind(this))
  this.client.del.apply(this.client, keys.concat(cb))
}
Queue.prototype.setStatus = function (status) {
  dbQueue.setStatus(this.status, status).then((statusResult) => {
    console.log('STATUS RESULT++++++++++++++++++++++++++++++++++++++')
    console.dir(statusResult)
  })
}

Queue.prototype.checkHealth = function (cb) {
  this.client.multi()
    .llen(this.toKey('waiting'))
    .llen(this.toKey('active'))
    .scard(this.toKey('succeeded'))
    .scard(this.toKey('failed'))
    .exec(function (err, results) {
      /* istanbul ignore if */
      if (err) return cb(err)
      return cb(null, {
        waiting: results[0],
        active: results[1],
        succeeded: results[2],
        failed: results[3]
      })
    })
}

Queue.prototype.runJob = function (job, cb) {
  var self = this
  var psTimeout
  var handled = false

  var preventStalling = function () {
    self.client.srem(self.toKey('stalling'), job.id, function () {
      if (!handled) {
        psTimeout = setTimeout(preventStalling, self.options.stallInterval * 1000 / 2)
      }
    })
  }
  preventStalling()

  var handleOutcome = function (err, data) {
    // silently ignore any multiple calls
    if (handled) {
      return
    }

    handled = true
    clearTimeout(psTimeout)

    self.finishJob(err, data, job, cb)
  }

  if (job.options.timeout) {
    var msg = 'Job ' + job.id + ' timed out (' + job.options.timeout + ' ms)'
    setTimeout(handleOutcome.bind(null, Error(msg)), job.options.timeout)
  }

  if (this.options.catchExceptions) {
    try {
      this.handler(job, handleOutcome)
    } catch (err) {
      handleOutcome(err)
    }
  } else {
    this.handler(job, handleOutcome)
  }
}

Queue.prototype.finishJob = function (err, data, job, cb) {
  var status = err ? 'failed' : 'succeeded'

  var multi = this.client.multi()
    .lrem(this.toKey('active'), 0, job.id)
    .srem(this.toKey('stalling'), job.id)

  var jobEvent = {
    id: job.id,
    event: status,
    data: err ? err.message : data
  }

  if (status === 'failed') {
    if (job.options.retries > 0) {
      job.options.retries -= 1
      job.status = 'retrying'
      jobEvent.event = 'retrying'
      multi.hset(this.toKey('jobs'), job.id, job.toData())
        .lpush(this.toKey('waiting'), job.id)
    } else {
      job.status = 'failed'
      multi.hset(this.toKey('jobs'), job.id, job.toData())
        .sadd(this.toKey('failed'), job.id)
    }
  } else {
    job.status = 'succeeded'
    multi.hset(this.toKey('jobs'), job.id, job.toData())
    if (this.options.removeOnSuccess) {
      multi.hdel(this.toKey('jobs'), job.id)
    } else {
      multi.sadd(this.toKey('succeeded'), job.id)
    }
  }

  if (this.options.sendEvents) {
    multi.publish(this.toKey('events'), JSON.stringify(jobEvent))
  }

  multi.exec(function (errMulti) {
    /* istanbul ignore if */
    if (errMulti) {
      return cb(errMulti)
    }
    return cb(null, status, err ? err : data)
  })
}


module.exports = Queue
