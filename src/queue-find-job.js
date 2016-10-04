const logger = require('./logger')(module)
const Promise = require('bluebird')
const dbResult = require('./db-result')

module.exports = function queueFindJob (q, predicate, raw) {
  logger('queueFindJob: ', predicate)
  return Promise.resolve().then(() => {
    return q.r
      .db(q.db)
      .table(q.name)
      .filter(predicate)
      .run()
  }).then((jobsData) => {
    logger('jobsData', jobsData)
    if (raw) { return jobsData }
    return dbResult.toJob(q, jobsData)
  })
}
