module.exports.remove = function (job) {
  const db = job.queue.dbConfig.db
  const tableName = job.queue.options.queueName
  return job.queue.r.db(db).table(tableName).get(job.id).delete().run()
}

module.exports.getById = function (queue, jobId) {
  return queue.r
    .db(queue.dbConfig.db)
    .table(queue.options.queueName)
    .get(jobId).run()
}

module.exports.getNextJob = function (queue) {
  return queue.r
    .db(queue.dbConfig.db)
    .table(queue.options.queueName)
    .orderBy('createdDate')
    .nth(0)
    .default({})
}

module.exports.setStatus = function (job, oldStatus, newStatus) {
  const db = job.queue.dbConfig.db
  const tableName = job.queue.options.queueName
  const r = job.queue.r
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
