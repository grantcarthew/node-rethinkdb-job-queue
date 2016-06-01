const logger = require('./logger').init(module)
const moment = require('moment')
const enums = require('./enums')
const jobLog = require('./job-log')
let dbStalledIntervalId

function reviewStalledJobs (q) {
  logger('reviewStalledJobs: ' + moment().format('YYYY-MM-DD HH:mm:ss.SSS'))
  const r = q.r
  const timeoutDate = moment().add(-1, 'minutes').toDate()
  const log = jobLog(
    moment().toDate(),
    q.id,
    enums.log.type.warning,
    enums.jobStatus.stalled,
    enums.messages.stalled
  )

  return r.table(q.name)
  .between(r.minval, timeoutDate, { index: enums.index.active })
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

module.exports.reviewStalledJobs = reviewStalledJobs
