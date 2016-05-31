const moment = require('moment')
const logger = require('./logger')
const enums = require('./enums')
const jobLog = require('./job-log')
let dbStalledIntervalId

function reviewStalledJobs (q) {
  logger('reviewStalledJobs: ' + moment().format('YYYY-DD-MM HH:mm:ss'))
  const r = q.r
  const timeoutDate = moment().add(-1, 'minutes').toDate()
  const log = jobLog(
    moment().toDate(),
    q.id,
    enums.log.type.warning,
    enums.statuses.active,
    enums.statuses.stalled,
    'Database review updated status to stalled'
  )

  return r.table(q.name)
  .between(r.minval, timeoutDate, { index: enums.indexes.active })
  .update({
    status: 'stalled',
    log: r.row('log').add([log])
  }).run()
}

module.exports.start = function (q) {
  logger('db-review start')
  if (dbStalledIntervalId) {
    return
  }
  const interval = 60 * 1000
  dbStalledIntervalId = setInterval(() => {
    return reviewStalledJobs(q)
  }, interval)
}

module.exports.stop = function (q) {
  logger('db-review stop')
  if (dbStalledIntervalId) {
    clearInterval(dbStalledIntervalId)
  }
}

module.exports.runOnce = reviewStalledJobs
