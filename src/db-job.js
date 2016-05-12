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
