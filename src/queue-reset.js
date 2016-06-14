const logger = require('./logger')(module)
const dbResult = require('./db-result')

module.exports = function (q) {
  logger('reset')
  return q.r.db(q.db)
  .table(q.name)
  .delete()
  .run()
  .then((resetResult) => {
    console.dir(resetResult)
  })
}
