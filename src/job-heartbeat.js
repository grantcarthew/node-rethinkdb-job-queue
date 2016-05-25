const Promise = require('bluebird')
const moment = require('moment')

const updateHeartbeat = function (q, job) {
  return setInterval(() => {
    return q.r.table(q.name).get(job.id)
      .update({ dateHeartbeat: moment().toDate() }).run()
  }, q.jobTimeout / 2)
}

module.exports.start = function (q, job) {
  return setInterval(() => {
    return q.r.table(q.name).get(job.id)
      .update({ dateHeartbeat: moment().toDate() }).run()
  }, q.jobTimeout / 2)
}

module.exports.stop = function (q, job) {

}
