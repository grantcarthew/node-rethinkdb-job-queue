const Promise = require('bluebird')
const moment = require('moment')
const logger = require('./logger')

const updateHeartbeat = function (q, job) {
  return setInterval(() => {
    logger('updateHeartbeat')
    return q.r.table(q.name).get(job.id)
      .update({ dateHeartbeat: moment().toDate() }).run()
  }, job.timeout * 1000 / 2)
}

module.exports.start = function (q, job) {
  return setInterval(() => {
    logger('start')
    return q.r.table(q.name).get(job.id)
      .update({ dateHeartbeat: moment().toDate() }).run()
  }, job.timeout * 1000 / 2)
}

// TODO: This module is not it use
