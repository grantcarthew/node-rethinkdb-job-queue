const debug = require('debug')('db-job')
const Promise = require('bluebird')
const moment = require('moment')
const enums = require('./enums')
const jobLog = require('./job-log')

module.exports.setDateStarted = function (job) {
  debug('setDateStarted')
  let now = moment().toDate()
  return job.q.r.table(job.q.name).get(job.id).update({
    dateStarted: now
  })
}

module.exports.completed = function (job, data) {
  debug('completed')
  job.status = enums.jobStatus.completed
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
  debug('failed')
  job.status = enums.jobStatus.failed
  console.log('ABOUT TO EMIT');
  job.q.emit('job failed', job.id)
  if (job.retryCount < job.retryMax) {
    job.status = enums.jobStatus.retry
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

module.exports.startHeartbeat = function (job) {
  debug('startHeartbeat')
  // TODO: delete these lines
  // console.log(job.timeout)
  // console.log(job.timeout * 1000 / 2)
  return setInterval((job) => {
    debug('Heartbeat: ' + job.id)
    return job.q.r.table(job.q.name).get(job.id)
      .update({ dateHeartbeat: moment().toDate() }).run()
  }, 1000, job)
  // TODO: reinstate this line.
  // }, job.timeout * 1000 / 2, job)
}

// TODO: Which one of these?
module.exports.setStatus = function (q, status) {
  debug('setStatus')
  q.setStatus(this.status, status).then((statusResult) => {
    console.log('STATUS RESULT++++++++++++++++++++++++++++++++++++++')
    console.dir(statusResult)
  })
}
module.exports.setStatus = function (job, oldStatus, newStatus) {
  debug('setStatus')
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
