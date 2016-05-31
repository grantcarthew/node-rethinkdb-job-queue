const Promise = require('bluebird')
const moment = require('moment')
const logger = require('./logger')
const enums = require('./enums')
const jobLog = require('./job-log')

module.exports.setDateStarted = function (job) {
  let now = moment().toDate()
  return job.q.r.table(job.q.name).get(job.id).update({
    dateStarted: now
  })
}

module.exports.completed = function (job, data) {
  job.status = enums.status.completed
  job.dateCompleted = moment().toDate()
  job.progress = 100

  const log = jobLog(
    job.dateCompleted,
    job.q.id,
    enums.log.type.information,
    job.status,
    enums.messages.completed,
    data
  )
  return job.q.r.table(job.q.name).get(job.id).update({
    status: job.status,
    dateCompleted: job.dateCompleted,
    progress: job.progress,
    log: job.q.r.row('log').add([log])
  }).run()
}

module.exports.failed = function (err, job, data) {
  job.status = enums.status.failed
  if (job.retryCount < job.retryMax) {
    job.status = enums.status.retry
    job.retryCount++
    job.priority = 1
  }
  job.dateFailed = moment().toDate()
  job.progress = 0

  const log = jobLog(
    job.dateFailed,
    job.q.id,
    enums.log.type.error,
    job.status,
    enums.messages.failed,
    data,
    err
  )
  return job.q.r.table(job.q.name).get(job.id).update({
    status: job.status,
    retryCount: job.retryCount,
    progress: job.probress,
    dateFailed: job.dateFailed,
    log: job.q.r.row('log').add([log])
  }).run()
}

module.exports.startHeartbeat = function (q, job) {
  return setInterval((job) => {
    logger('Heartbeat: ' + job.id)
    console.dir(job)
    return job.q.r.table(q.name).get(job.id)
      .update({ dateHeartbeat: moment().toDate() }).run()
  }, job.timeout * 1000 / 2, job)
}

module.exports.setStatus = function (q, status) {
  q.setStatus(this.status, status).then((statusResult) => {
    console.log('STATUS RESULT++++++++++++++++++++++++++++++++++++++')
    console.dir(statusResult)
  })
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
