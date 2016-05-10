const EventEmitter = require('events')
const util = require('util')
const rethinkdbdash = require('rethinkdbdash')
const Promise = require('bluebird')
const logger = require('./logger')

const optionParser = require('./option-parser')
const optionDefaults = require('./option-defaults')
const Job = require('./job')
const helpers = require('./helpers')
const barrier = helpers.barrier
const dbSetup = require('./db-setup')

function Queue (options, dbConfig = optionDefaults.db) {
  if (!new.target) {
    return new Queue(options, dbConfig)
  }
  this.options = optionParser.parseQueueOptions(options)
  this.dbConfig = optionParser.parseDbConfig(dbConfig)
  this.paused = false
  this.jobs = {} // TODO: Remove
  this.r = rethinkdbdash(this.dbConfig)
  this.assertDbPromise = Promise.resolve(false)

  let boolProps = ['isWorker', 'getEvents', 'sendEvents', 'removeOnSuccess', 'catchExceptions']
  boolProps.forEach(function (prop) {
    this.options[prop] = typeof options[prop] === 'boolean' ? options[prop] : optionDefaults.queue[prop]
  }.bind(this))

  // TODO: Remove this
  // // Wait for Lua loading and client connection; bclient and eclient/subscribe if needed
  // var reportReady = barrier(
  //   2 + this.options.isWorker + this.options.getEvents * 2,
  //   this.emit.bind(this, 'ready')
  // )

  // TODO: Remove this
  // var makeClient = function (clientName) {
  //   this[clientName] = redis.createClient.apply(redis, this.options.redis.params)
  //   this[clientName].on('error', this.emit.bind(this, 'error'))
  //   this[clientName].select(this.options.redis.db, reportReady)
  // }.bind(this)

  // makeClient('client')

  if (this.options.isWorker) {
    // TODO: Is iwWorker needed with RethinkDB?
    // makeClient('bclient')
  }

  if (this.options.getEvents) {
    // TODO: PubSub events.
    // makeClient('eclient')
    // this.eclient.subscribe(this.toKey('events'))
    // this.eclient.on('message', this.onMessage.bind(this))
    // this.eclient.on('subscribe', reportReady)
  }

// TODO: Remove.
// this.options.serverKey = this.options.redis.socket || this.options.redis.host + ':' + this.options.redis.port
// lua.buildCache(this.options.serverKey, this.client, reportReady)
}

util.inherits(Queue, EventEmitter)

Queue.prototype.onMessage = function (err, change) {
  console.log('------------- QUEUE CHANGE -------------')
  console.dir(change)
  console.log('----------------------------------------')
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

Queue.prototype.close = function (cb) {
  cb = cb || helpers.defaultCb
  this.paused = true

  var closeTimeout = setTimeout(function () {
    return cb(Error('Timed out closing redis connections'))
  }, 5000)

  var clients = [this.client]
  if (this.options.isWorker) {
    clients.push(this.bclient)
  }

  if (this.options.getEvents) {
    clients.push(this.eclient)
  }

  var handleEnd = barrier(clients.length, function () {
    clearTimeout(closeTimeout)
    return cb(null)
  })

  clients.forEach(function (client) {
    client.end()
    client.stream.on('close', handleEnd)
  })
}

Queue.prototype.destroy = function (cb) {
  cb = cb || helpers.defaultCb
  var keys = ['id', 'jobs', 'stallTime', 'stalling', 'waiting', 'active', 'succeeded', 'failed']
    .map(this.toKey.bind(this))
  this.client.del.apply(this.client, keys.concat(cb))
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

Queue.prototype.createJob = function (data) {
  return this._assertDb().then(() => {
    return new Job(this, null, data)
  })
}

Queue.prototype.getJob = function (jobId, cb) {
  var self = this
  if (jobId in this.jobs) {
    return process.nextTick(cb.bind(null, null, this.jobs[jobId]))
  } else {
    Job.fromId(this, jobId, function (err, job) {
      if (err) return cb(err)
      self.jobs[jobId] = job
      return cb(err, job)
    })
  }
}

Queue.prototype.getNextJob = function (cb) {
  var self = this
  this.bclient.brpoplpush(this.toKey('waiting'), this.toKey('active'), 0, function (err, jobId) {
    if (err) return cb(err)
    return Job.fromId(self, Number(jobId), cb)
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

Queue.prototype.process = function (concurrency, handler) {
  if (!this.options.isWorker) {
    throw Error('Cannot call Queue.prototype.process on a non-worker')
  }

  if (this.handler) {
    throw Error('Cannot call Queue.prototype.process twice')
  }

  if (typeof concurrency === 'function') {
    handler = concurrency
    concurrency = 1
  }

  var self = this
  this.handler = handler
  this.running = 0
  this.queued = 1
  this.concurrency = concurrency

  var jobTick = function () {
    if (self.paused) {
      self.queued -= 1
      return
    }

    // invariant: in this code path, self.running < self.concurrency, always
    // after spoolup, self.running + self.queued === self.concurrency
    self.getNextJob(function (getErr, job) {
      /* istanbul ignore if */
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

  var restartProcessing = function () {
    // maybe need to increment queued here?
    self.bclient.once('ready', jobTick)
  }
  this.bclient.on('error', restartProcessing)
  this.bclient.on('end', restartProcessing)

  this.checkStalledJobs(setImmediate.bind(null, jobTick))
}

Queue.prototype.checkStalledJobs = function (interval, cb) {
  var self = this
  cb = typeof interval === 'function' ? interval : cb || helpers.defaultCb

  this.client.evalsha(lua.shas.checkStalledJobs, 4,
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

Queue.prototype.toKey = function (str) {
  return this.options.keyPrefix + str
}

// Ensures the database and table specified exists
Queue.prototype._assertDb = function () {
  return this.assertDbPromise.then((dbAsserted) => {
    if (dbAsserted) {
      return undefined
    }

    this.assertDbPromise = dbSetup.assertDatabase(this.r,
      this.dbConfig.db)
    .then(() => {
      return dbSetup.assertTable(this.r,
      this.dbConfig.db,
      this.options.queueName).then(() => {
        return dbSetup.queueChangeFeed(this.r,
        this.dbConfig.db,
        this.options.queueName,
        this.onMessage)
      })
    })
    return this.assertDbPromise
  })
}

module.exports = Queue
