module.exports.save = function (job) {
  const dbName = job.queue.dbConfig.dbName
  const dbTableName = job.queue.options.queueName
  const jobCopy = Object.assign({}, job)
  delete jobCopy.queue
  delete jobCopy.id
  return job.queue.r.db(dbName).table(dbTableName).insert(jobCopy).run()
}
