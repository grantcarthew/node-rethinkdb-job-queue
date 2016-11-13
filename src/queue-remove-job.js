const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const jobParse = require('./job-parse')

module.exports = function removeJob (q, jobOrId) {
  logger('removeJob: ' + jobOrId)

  return Promise.resolve().then(() => {
    return jobParse.id(jobOrId)
  }).then((jobIds) => {
    return Promise.props({
      jobIds,
      removeResult: q.r.db(q.db)
      .table(q.name)
      .getAll(...jobIds)
      .delete()
      .run()
    })
  }).then((result) => {
    for (let id of result.jobIds) {
      logger(`Event: removed`, q.id, id)
      q.emit(enums.status.removed, q.id, id)
    }
    return result.jobIds
  })
}
