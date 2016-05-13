const logger = require('./logger')

module.exports.registerQueueChangeFeed = function (q) {
  return q.r.table(q.name)
  .changes().run().then((feed) => {
    feed.each((err, change) => {
      q.onChange(err, change)
    })
  })
}

module.exports.addJob = function (q, job) {
  let p = q.priorities
  let jobs = Array.isArray(job) ? job : [job]
  jobs.map((j) => {
    j.priority = p[j.priority]
  })
  return q.r.table(q.name)
  .insert(jobs).run().then((saveResult) => {
    if (saveResult.errors > 0) {
      return Promise.reject(saveResult)
    }
    return saveResult
  })
}

module.exports.getNextJob = function (q, concurrency) {
  concurrency = concurrency || 0
  return q.r
    .db(q.db)
    .table(q.name)
    .orderBy(q.enums.indexes.priorityAndDateCreated)
    .nth(concurrency)
    .default({})
    .run()
}

module.exports.deleteTable = function (r, db) {
  return r.dbDrop(db).run()
}

module.exports.remove = function (job) {
  const db = job.q.db
  const tableName = job.q.name
  return job.q.r.db(db).table(tableName).get(job.id).delete().run()
}

module.exports.getById = function (q, jobId) {
  return q.r
    .db(q.db)
    .table(q.name)
    .get(jobId).run()
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
