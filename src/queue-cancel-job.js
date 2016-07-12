const logger = require('./logger')(module)
const Promise = require('bluebird')
const moment = require('moment')
const is = require('./is')
const enums = require('./enums')
const dbResult = require('./db-result')
const jobParse = require('./job-parse')

module.exports = function cancel (q, job, reason) {
  logger('cancel')

  if (is.boolean(job.q.removeFinishedJobs) &&
      job.q.removeFinishedJobs === true) {
    return q.removeJob(job).then((deleteResult) => {
      q.emit(enums.status.cancelled, j.id)
      job.q.emit(enums.status.removed, deleteResult.id)
      return deleteResult
    })
  } else {
    return Promise.resolve().then(() => {
      return jobParse.id(job)
    }).then((ids) => {
        return q.r.db(q.db).table(q.name)
        .getAll(...ids)
        .update({
          status: enums.status.cancelled,
          dateFinished: moment().toDate(),
          log: q.r.row('log').append({
            date: moment().toDate(),
            queueId: q.id,
            type: enums.log.information,
            status: enums.status.cancelled,
            retryCount: q.r.row('retryCount'),
            message: reason
          }),
          queueId: q.id
        }, {returnChanges: true})
        .run()
    }).then((updateResult) => {
      return dbResult.toJob(q, updateResult)
    }).then((cancelledJobs) => {
      cancelledJobs.forEach((j) => {
        q.emit(enums.status.cancelled, j.id)
      })
      return cancelledJobs
    })
  }
}
