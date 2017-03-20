const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')

module.exports.createLogObject = createLogObject
module.exports.commitLog = commitLog
module.exports.getLastLog = getLastLog

function createLogObject (job,
    data = {},
    message = enums.message.seeLogData,
    type = enums.log.information,
    status = job.status) {
  logger('commitLog', data, message, type, status)
  return {
    date: new Date(),
    queueId: job.q.id,
    message,
    data,
    type,
    status,
    retryCount: job.retryCount,
    processCount: job.processCount
  }
}

function commitLog (job,
  data = {},
  message = enums.message.seeLogData,
  type = enums.log.information,
  status = job.status) {
  logger('commitLog', data, message, type, status)

  const newLog = createLogObject(job, data, message, type, status)

  if (job.status === enums.status.created) {
    return Promise.reject(new Error(enums.message.jobNotAdded))
  }
  return Promise.resolve().then(() => {
    return job.q.r.db(job.q.db)
    .table(job.q.name)
    .get(job.id)
    .update({
      log: job.q.r.row('log').append(newLog),
      queueId: job.q.id
    })
  }).then((updateResult) => {
    job.log.push(newLog)
    job.log.sort(compareTime)
    logger(`Event: log`, job.q.id, job.id)
    job.q.emit(enums.status.log, job.q.id, job.id)
    return true
  })
}

function getLastLog (job) {
  job.log.sort(compareTime)
  return job.log.slice(-1)[0]
}

function compareTime (a, b) {
  return a.date.getTime() >= b.date.getTime() ? 1 : -1
}
