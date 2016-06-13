const logger = require('./logger')(module)
const dbResult = require('./db-result')

module.exports.removeJob = function (job) {
  logger('removeJob: ' + job.id)
  const db = job.q.db
  const tableName = job.q.name
  return job.q.r.db(db)
  .table(tableName)
  .get(job.id)
  .delete()
  .run()
  .then((deleteResult) => {
    console.log('TODO: change result time and support arrays??? maybe???')
  })
}
