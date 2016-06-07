const logger = require('./logger')(module)

module.exports = function statusSummary (q) {
  logger('statusSummary')
  return q.r.table(q.name)
  .group((job) => {
    return job.pluck('status')
  }).count().then((reduction) => {
    const summary = {}
    for (let stat of reduction) {
      summary[stat.group.status] = stat.reduction
    }
    logger('summary', summary)
    return summary
  })
}
