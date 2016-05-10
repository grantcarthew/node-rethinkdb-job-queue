module.exports.save = function (job) {
  const db = job.queue.dbConfig.db
  const dbTableName = job.queue.options.queueName
  const jobCopy = Object.assign({}, job)
  delete jobCopy.queue
  delete jobCopy.id
  return job.queue.r.db(db).table(dbTableName).insert(jobCopy).run()
}
