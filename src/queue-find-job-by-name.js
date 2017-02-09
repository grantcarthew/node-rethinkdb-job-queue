const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbResult = require('./db-result')

module.exports = function queueFindJobByName (q, name, raw) {
  logger('queueFindJobByName: ', name, raw)
  return Promise.resolve().then(() => {
    return q.r
    .db(q.db)
    .table(q.name)
    .getAll(name, { index: enums.index.indexName })
    .orderBy('dateCreated')
    .run(q.queryRunOptions)
  }).then((jobsData) => {
    logger('jobsData', jobsData)
    if (raw) { return jobsData }
    return dbResult.toJob(q, jobsData)
  })
}
