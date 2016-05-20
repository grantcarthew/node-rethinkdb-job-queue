const moment = require('moment')
const enums = require('./enums')
const jobLog = require('./job-log')

function reviewStalledJobs (q) {
  const timeoutDate = moment().add(-q.stallInterval, 'minutes').toDate()
  console.dir(jobLog)
  const log = jobLog(
    moment().toDate(),
    'status',
    'active',
    'stalled',
    'Maintenance updated status to stalled'
  )

  return q.r.table(q.name)
  .between(q.r.minval, timeoutDate, { index: enums.indexes.active })
  .update({
    status: 'stalled',
    log: q.r.row('log').add([log])
  }).run()
}

module.exports = function (q) {
  return reviewStalledJobs(q)
}
