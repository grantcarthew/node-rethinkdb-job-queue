const Promise = require('bluebird')
const moment = require('moment')
const logger = require('./logger')
const enums = require('./enums')

module.exports.registerQueueChangeFeed = function (q) {
  return q.r.table(q.name)
  .changes().run().then((feed) => {
    feed.each((err, change) => {
      q.onChange(err, change)
    })
  })
}

module.exports.addJob = function (q, job) {
  let jobs = Array.isArray(job) ? job : [job]
  jobs = jobs.map((job) => job.cleanCopy)
  return q.r.table(q.name)
  .insert(jobs).run().then((saveResult) => {
    if (saveResult.errors > 0) {
      return Promise.reject(saveResult)
    }
    return saveResult
  })
}

module.exports.getJobById = function (q, jobId) {
  return q.r
    .db(q.db)
    .table(q.name)
    .get(jobId).run()
}

module.exports.getNextJob = function (q) {
  const now = moment().toDate()
  const quantity = q.concurrency - q.running
  return q.r
    .table(q.name)
    .orderBy({index: enums.indexes.inactive})
    .limit(quantity)
    .update({
      status: enums.statuses.active,
      dateStarted: now,
      dateModified: now,
      dateHeartbeat: now
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
  const r = q.r
  return r.table(q.name)
  .group((job) => {
    return job.pluck('status')
  }).count().then((reduction) => {
    const summary = {}
    for (let stat of reduction) {
      summary[stat.group.status] = stat.reduction
    }
    return summary
  })
}

module.exports.deleteQueue = function (q) {
  logger('deleteQueue')
  q.ready = Promise.reject('The queue has been deleted')
  return q.r.dbDrop(q.db).run()
}

module.exports.removeJob = function (job) {
  const db = job.q.db
  const tableName = job.q.name
  return job.q.r.db(db).table(tableName).get(job.id).delete().run()
}

module.exports.setStatus = function (job, oldStatus, newStatus) {
  const db = job.q.db
  const tableName = job.q.name
  const r = job.q.r
  r.db(db).table(tableName).get(job.id).update((storedJob) => {
    return r.branch(
      storedJob('status').eq(oldStatus),
      {status: newStatus},
      false
    )
  }).run().then((updateResult) => {
    console.log('UPDATE RESULT~~~~~~~~~~~~~~~~~~~~~~~~~~~')
    console.dir(updateResult)
  })
}
