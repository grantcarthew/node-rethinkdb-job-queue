const EventEmitter = require('events').EventEmitter
const rethinkdbdash = require('rethinkdbdash')
const Promise = require('bluebird')
const logger = require('./logger')
const Job = require('./job')
const dbAssert = require('./db-assert')
const dbQueue = require('./db-queue')
const dbJob = require('./db-job')

function Queue (options) {
  if (!new.target) {
    return new Queue(options)
  }

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
  this.stallInterval = typeof options.stallInterval === 'number'
      ? options.stallInterval : 30
  this.name = options.name || 'rjqJobList'
  this.isWorker = options.isWorker || true
  this.removeOnSuccess = options.removeOnSuccess || true
  this.catchExceptions = options.catchExceptions || true
  this.paused = false

  this.assertDbPromise = Promise.resolve(false)

  if (this.isWorker) {
    // TODO: Is iwWorker needed with RethinkDB?
    // makeClient('bclient')
  }

  if (this.getEvents) {
    // TODO: PubSub events.
    // makeClient('eclient')
    // this.eclient.subscribe(this.toKey('events'))
    // this.eclient.on('message', this.onMessage.bind(this))
    // this.eclient.on('subscribe', reportReady)
  }
}

Queue.prototype = Object.create(EventEmitter.prototype)
Queue.prototype.enums = {
  priorities: {
    lowest: 60, low: 50, normal: 40, medium: 30, high: 20, highest: 10
  },
  statuses: {
    created: 'created',
    delayed: 'delayed',
    active: 'active',
    waiting: 'waiting',
    complete: 'complete',
    failed: 'failed',
    retry: 'retry'
  },
  indexes: {
    priorityAndDateCreated: 'PriorityAndDateCreated'
  }
}

Queue.prototype.createJob = function (data, options) {
  return new Job(data, options)
}

Queue.prototype.addJob = function (job) {
  console.dir(this.priorities)
  let p = this.enums.priorities
  return this._assertDb().then(() => {
    let jobs = Array.isArray(job) ? job : [job]
    jobs.map((j) => {
      j.priority = p[j.priority]
    })
    return this.r.db(this.db).table(this.name)
    .insert(jobs).run().then((saveResult) => {
      if (saveResult.errors > 0) {
        return Promise.reject(saveResult)
      }
      return saveResult
    })
  })
}

Queue.prototype.getJob = function (jobId) {
  return this._assertDb().then(() => {
    return dbJob.getById(this, jobId)
  })
}

Queue.prototype.getNextJob = function (cb) {
  return this._assertDb().then(() => {
    return dbQueue.getNextJob(this)
  })
}

Queue.prototype.onMessage = function (err, change) {
  console.log('------------- QUEUE CHANGE -------------')
  console.dir(change)
  console.log('----------------------------------------')

  // New job added
  if (change.new_val && !change.old_val) {
    let newJob = new Job(null, change.new_val)
    this.emit('enqueue', newJob)
    this.handler(newJob)
  }
  return

  message = JSON.parse(message)
  if (message.event === 'failed' || message.event === 'retrying') {
    message.data = Error(message.data)
  }

  this.emit('job ' + message.event, message.id, message.data)

  if (this.jobs[message.id]) {
    if (message.event === 'progress') {
      this.jobs[message.id].progress = message.data
    } else if (message.event === 'retrying') {
      this.jobs[message.id].options.retries -= 1
    }

    this.jobs[message.id].emit(message.event, message.data)

    if (message.event === 'succeeded' || message.event === 'failed') {
      delete this.jobs[message.id]
    }
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

  let jobTick = function () {
    if (self.paused) {
      self.queued -= 1
      return
    }

    // invariant: in this code path, self.running < self.concurrency, always
    // after spoolup, self.running + self.queued === self.concurrency
    self.getNextJob(function (getErr, job) {
      if (getErr) {
        self.emit('error', getErr)
        return setImmediate(jobTick)
      }

      self.running += 1
      self.queued -= 1
      if (self.running + self.queued < self.concurrency) {
        self.queued += 1
        setImmediate(jobTick)
      }

      self.runJob(job, function (err, status, result) {
        self.running -= 1
        self.queued += 1

        /* istanbul ignore if */
        if (err) {
          self.emit('error', err)
        } else {
          self.emit(status, job, result)
        }

        setImmediate(jobTick)
      })
    })
  }

  let restartProcessing = function () {
    // maybe need to increment queued here?
    //self.bclient.once('ready', jobTick)
  }
  //this.bclient.on('error', restartProcessing)
  //this.bclient.on('end', restartProcessing)

  this.checkStalledJobs(setImmediate.bind(null, jobTick))
}

Queue.prototype.checkStalledJobs = function (interval, cb) {
  var self = this
  cb = typeof interval === 'function' ? interval : cb// || helpers.defaultCb

  // this.client.evalsha(lua.shas.checkStalledJobs, 4,
  //   this.toKey('stallTime'), this.toKey('stalling'), this.toKey('waiting'), this.toKey('active'),
  //   Date.now(), this.options.stallInterval * 1000, function (err) {
  //     /* istanbul ignore if */
  //     if (err) return cb(err)
  //
  //     if (typeof interval === 'number') {
  //       setTimeout(self.checkStalledJobs.bind(self, interval, cb), interval)
  //     }
  //
  //     return cb()
  //   }
  // )
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
  dbJob.setStatus(this.status, status).then((statusResult) => {
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

// Ensures the database and table specified exists.
// Also registers change feed on the queue table.
Queue.prototype._assertDb = function () {
  this.assertDbPromise = Promise.resolve().then(() => {
    setTimeout(() => {
      return false
    }, 3000)
  })
  return this.assertDbPromise.then((dbAsserted) => {
    if (dbAsserted) {
      return undefined
    }

    this.assertDbPromise = dbAssert.database(this).then(() => {
      return dbAssert.table(this)
    }).then(() => {
      return dbAssert.index(this)
    }).then(() => {
      return this.isWorker ? this._registerQueueChangeFeed() : true
    })
    return this.assertDbPromise
  })
}

Queue.prototype._registerQueueChangeFeed = function () {
  return this.r.db(this.db).table(this.name)
  .changes().run().then((feed) => {
    feed.each(this.onMessage.bind(this))
  })
}

module.exports = Queue
