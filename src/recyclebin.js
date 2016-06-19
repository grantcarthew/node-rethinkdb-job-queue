module.exports.startHeartbeat = function (job) {
  logger('startHeartbeat')
  console.log(job.id)
  return setInterval((job) => {
    logger('Heartbeat: ' + job.id)
    return job.q.r.db(q.db).table(job.q.name).get(job.id)
      .update({ dateHeartbeat: moment().toDate() }).run()
  }, job.timeout * 900 / 2, job)
}

module.exports.setStatus = function (q, status) {
  logger('setStatus')
  q.setStatus(this.status, status).then((statusResult) => {
    console.log('STATUS RESULT++++++++++++++++++++++++++++++++++++++')
    console.dir(statusResult)
  })
}
module.exports.setStatus = function (job, oldStatus, newStatus) {
  logger('setStatus')
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

module.exports.setDateStarted = function (job) {
  logger('setDateStarted')
  let now = moment().toDate()
  return job.q.r.db(job.q.db).table(job.q.name).get(job.id).update({
    dateStarted: now
  })
}

module.exports.createIndexActiveDateStarted = function (q) {
  logger('createIndexActiveDateStarted')
  let indexName = enums.index.active
  return q.r.db(q.db).table(q.name).indexList()
  .contains(indexName).run().then((exists) => {
    if (exists) { return exists }
    return q.r.db(q.db).table(q.name).indexCreate(indexName, function (row) {
      return q.r.branch(
        row('status').eq('active'),
        row('dateHeartbeat'),
        null
      )
    }).run()
  })
}

function jobTimeout (q) {
  logger('jobTimeout: ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'))
  const r = q.r
  const timeoutDate = moment().add(-1, 'minutes').toDate()
  const log = jobLog(
    moment().toDate(),
    q.id,
    enums.log.warning,
    enums.jobStatus.timeout,
    enums.message.timeout
  )

  return q.r.db(q.db).table(q.name)
  .between(q.r.minval, timeoutDate, { index: enums.index.active_dateStarted })
  .update({
    status: enums.jobStatus.timeout,
    log: q.r.row('log').append(log)
  }).run()
}
