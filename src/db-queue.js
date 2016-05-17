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
  let p = enums.priorities
  let jobs = Array.isArray(job) ? job : [job]
  jobs = jobs.map((j) => {
    let jobCopy = Object.assign({}, j)
    jobCopy.priority = p[jobCopy.priority]
    delete jobCopy._events
    delete jobCopy._eventsCount
    return jobCopy
  })
  return q.r.table(q.name)
  .insert(jobs).run().then((saveResult) => {
    if (saveResult.errors > 0) {
      return Promise.reject(saveResult)
    }
    return saveResult
  })
}

module.exports.getById = function (q, jobId) {
  return q.r
    .db(q.db)
    .table(q.name)
    .get(jobId).run()
}

module.exports.getNextJob = function (q, concurrency) {
  concurrency = concurrency || 3
  return q.r
    .db(q.db)
    .table(q.name)
    .getAll('created', 'waiting', { index: enums.indexes.status })
    .orderBy(enums.indexes.priorityAndDateCreated)
    .limit(concurrency)
    .update({status: enums.statuses.active}, {returnChanges: true})
    .default({})
    .run()
}

module.exports.deleteQueue = function (q) {
  logger('deleteQueue')
  q.ready = Promise.reject('The queue has been deleted')
  return q.r.dbDrop(q.db).run()
}

module.exports.remove = function (job) {
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
