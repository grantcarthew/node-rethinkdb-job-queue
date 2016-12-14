const logger = require('./logger')(module)
const Promise = require('bluebird')
const is = require('./is')
const enums = require('./enums')
const dbResult = require('./db-result')
const jobParse = require('./job-parse')

module.exports = function cancelJob (q, jobOrId, reason) {
  logger('cancelJob', jobOrId, reason)

  return Promise.resolve().then(() => {
    return jobParse.id(jobOrId)
  }).then((ids) => {
    return q.r.db(q.db)
    .table(q.name)
    .getAll(...ids)
    .update({
      status: enums.status.cancelled,
      dateFinished: new Date(),
      log: q.r.row('log').append({
        date: new Date(),
        queueId: q.id,
        type: enums.log.information,
        status: enums.status.cancelled,
        retryCount: q.r.row('retryCount'),
        processCount: q.r.row('processCount'),
        message: reason
      }),
      queueId: q.id
    }, {returnChanges: true})
    .run()
  }).then((updateResult) => {
    logger('updateResult', updateResult)
    return dbResult.toIds(updateResult)
  }).then((jobIds) => {
    jobIds.forEach((jobId) => {
      logger(`Event: cancelled`, q.id, jobId)
      q.emit(enums.status.cancelled, q.id, jobId)
    })
    if (is.true(q.removeFinishedJobs)) {
      return q.removeJob(jobIds).then((deleteResult) => {
        logger(`Removed finished jobs on cancel [${deleteResult}]`)
        return jobIds
      })
    } else {
      return jobIds
    }
  })
}
