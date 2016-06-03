const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbReview = require('./db-review')

module.exports.startQueueChangeFeed = function (q) {
  logger('startQueueChangeFeed')
  return q.r.table(q.name)
  .changes().run().then((feed) => {
    q.feed = feed
    feed.each((err, change) => {
      q.onChange(err, change)
    })
  })
}

module.exports.addJob = function (q, job) {
  logger('addJob :' + job.id)
  let jobs = Array.isArray(job) ? job : [job]
  jobs = jobs.map((job) => job.cleanCopy)
  return q.r.table(q.name)
  .insert(jobs, {returnChanges: true}).run()
  .then((saveResult) => {
    if (saveResult.errors > 0) {
      return Promise.reject(saveResult)
    }
    return saveResult.changes
  }).map((change) => {
    return q.createJob(null, change.new_val)
  })
}

module.exports.removeJob = function (job) {
  logger('removeJob: ' + job.id)
  const db = job.q.db
  const tableName = job.q.name
  return job.q.r.db(db).table(tableName).get(job.id).delete().run()
}

module.exports.getJobById = function (q, jobId) {
  logger('getJobById: ' + job.id)
  return q.r
    .db(q.db)
    .table(q.name)
    .get(jobId).run()
}

module.exports.getNextJob = function (q) {
  logger('getNextJob')
  logger(`Concurrency: ${q.concurrency} Running: ${q.running}`)
  const quantity = q.concurrency - q.running
  return q.r
    .table(q.name)
    .orderBy({index: enums.index.inactive_priority_dateCreated})
    .limit(quantity)
    .update({
      status: enums.jobStatus.active,
      dateStarted: q.r.now()
    }, {returnChanges: true})
    .default({})
    .run().then((updateResult) => {
      console.dir(updateResult)
      if (updateResult.changes) {
        return updateResult.changes.map((change) => {
          return q.createJob(null, change.new_val)
        })
      }
      return []
    })
}

module.exports.statusSummary = function (q) {
  logger('statusSummary')
  const r = q.r
  return r.table(q.name)
  .group((job) => {
    return job.pluck('status')
  }).count().then((reduction) => {
    const summary = {}
    for (let stat of reduction) {
      summary[stat.group.status] = stat.reduction
    }
    logger('summary', summary)
    return summary
  })
}

const stopQueue = function (q, stopTimeout, drainPool = true) {
  logger('deleteQueue')
  q.paused = true
  let stopIntervalId
  let stopTimeoutId
  const cleanUp = () => {
    if (drainPool) { q.r.getPoolMaster().drain() }
    if (stopIntervalId) { clearInterval(stopIntervalId) }
    if (stopIntervalId) { clearInterval(stopIntervalId) }
  }

  return q.ready.then(() => {
    logger('Waiting half stop time')
    return Promise.delay(stopTimeout / 2)
  }).then(() => {
    return new Promise((resolve) => {
      if (q.feed) { q.feed.close() }
      dbReview.stop(q)

      stopTimeoutId = setTimeout(() => {
        cleanUp()
        q.running < 1 ? resolve(enums.message.allJobsStopped)
          : resolve(enums.message.failedToStop)
      }, stopTimeout / 2)

      stopIntervalId = setInterval(() => {
        if (q.running < 1) {
          cleanUp()
          resolve(enums.message.allJobsStopped)
        }
      }, stopTimeout / 12)
    })
  })
}
module.exports.stopQueue = stopQueue

module.exports.deleteQueue = function (q, deleteTimeout) {
  logger('deleteQueue')
  return stopQueue(q, deleteTimeout, false).then(() => {
    q.ready = false
    return q.r.dbDrop(q.db).run()
  }).then(() => {
    return q.r.getPoolMaster().drain()
  })
}
