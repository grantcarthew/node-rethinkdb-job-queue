const logger = require('./logger')(module)
const Promise = require('bluebird')

module.exports = function summary (q) {
  logger('summary')
  return Promise.resolve().then(() => {
    return q.r.db(q.db).table(q.name)
    .group((job) => {
      return job.pluck('status')
    }).count()
  }).then((reduction) => {
    const summary = {
      waiting: 0,
      active: 0,
      completed: 0,
      cancelled: 0,
      failed: 0,
      terminated: 0
    }
    for (let stat of reduction) {
      summary[stat.group.status] = stat.reduction
    }
    summary.total = Object.keys(summary).reduce((runningTotal, key) => {
      return runningTotal + summary[key]
    }, 0)
    logger('summary', summary)
    return summary
  })
}
