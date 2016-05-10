module.exports.save = function (job) {
  const db = job.queue.dbConfig.db
  const tableName = job.queue.options.queueName
  const jobCopy = Object.assign({}, job)
  delete jobCopy.queue
  delete jobCopy.id
  return job.queue.r.db(db).table(tableName).insert(jobCopy).run()
}

module.exports.remove = function (job) {
  const db = job.queue.dbConfig.db
  const tableName = job.queue.options.queueName
  return job.queue.r.db(db).table(tableName).get(job.id).delete().run()
}
