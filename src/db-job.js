const Promise = require('bluebird')
const moment = require('moment')
const logger = require('./logger')
const enums = require('./enums')

module.exports.setStatus = function (q, status) {
  q.setStatus(this.status, status).then((statusResult) => {
    console.log('STATUS RESULT++++++++++++++++++++++++++++++++++++++')
    console.dir(statusResult)
  })
}

module.exports.setDateStarted = function (q, job) {
  let now = moment().toDate()
  return q.r.table(q.name).get(job.id).update({
    dateStarted: now
  })
}

module.exports.setDateCompleted = function (q, job) {
  let now = moment().toDate()
  return q.r.table(q.name).get(job.id).update({
    status: enums.statuses.completed,
    dateStarted: now
  })
}