const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbResult = require('./db-result')
const jobParse = require('./job-parse')
const jobLog = require('./job-log')

module.exports = function queueReanimateJob (q,
    jobOrId,
    dateEnable = new Date()) {
  logger('queueGetJob: ', jobOrId)
  return Promise.resolve().then(() => {
    return jobParse.id(jobOrId)
  }).then((ids) => {
    let log = jobLog.createLogObject(
      { q, retryCount: 0 },
      null,
      enums.message.jobReanimated,
      enums.log.information,
      enums.status.waiting
    )
    return q.r
    .db(q.db)
    .table(q.name)
    .getAll(...ids)
    .update({
      dateEnable,
      log: q.r.row('log').append(log),
      progress: 0,
      queueId: q.id,
      retryCount: 0,
      status: enums.status.waiting
    }, {returnChanges: true})
    .run(q.queryRunOptions)
  }).then((jobsResult) => {
    logger('jobsResult', jobsResult)
    return dbResult.toIds(jobsResult)
  }).then((reanimatedJobIds) => {
    for (let reanimatedJobId of reanimatedJobIds) {
      logger(`Event: reanimated`, q.id, reanimatedJobId)
      q.emit(enums.status.reanimated, q.id, reanimatedJobId)
    }
    return reanimatedJobIds
  })
}
