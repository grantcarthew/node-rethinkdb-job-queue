const moment = require('moment')

const updateHeartbeat = function (q, job) {
  return q.r.table(q.name).get(job.id)
  .update({ dateHeartbeat: moment().toString() }).run()
}

module.exports = function (q, handler, concurrency = 1) {
  if (!q.isWorker) {
    throw Error('Cannot call Queue.prototype.process on a non-worker')
  }

  if (q.handler) {
    throw Error('Cannot call Queue.prototype.process twice')
  }

  q.handler = handler
  q.running = 0
  q.queued = 1
  q.concurrency = concurrency

  let jobTick = () => {
    if (q.paused) {
      q.queued -= 1
      return
    }

    // invariant: in this code path, self.running < self.concurrency, always
    // after spoolup, self.running + self.queued === self.concurrency
    q.getNextJob().then((nextJob) => {
      q.running += 1
      q.queued -= 1
      if (q.running + q.queued < q.concurrency) {
        q.queued += 1
        setImmediate(jobTick)
      }

      q.runJob((jobRunResult) => {
        q.emit(
          jobRunResult.status,
          jobRunResult.job,
          jobRunResult.result
        )
        return setImmediate(jobTick)
      }).catch((err) => {
        q.emit('error', err)
      })
    }).catch((err) => {
      q.emit('error', err)
      return setImmediate(jobTick)
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

}
