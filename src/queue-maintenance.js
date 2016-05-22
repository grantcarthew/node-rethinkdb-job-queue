const moment = require('moment')
const logger = require('./logger')
const enums = require('./enums')
const jobLog = require('./job-log')
let maintenanceId

function reviewStalledJobs (q) {
  logger('reviewStalledJobs: ' + moment().format('YYYY-DD-MM-HH-mm-ss'))
  const r = q.r
  const timeoutDate = moment().add(-q.stallInterval, 'minutes').toDate()
  const log = jobLog(
    moment().toDate(),
    q.id,
    enums.log.type.warning,
    enums.statuses.active,
    enums.statuses.stalled,
    'Maintenance updated status to stalled'
  )

  return r.table(q.name)
  .between(r.minval, timeoutDate, { index: enums.indexes.active })
  .update({
    status: 'stalled',
    log: r.row('log').add([log])
  }).run()
}

module.exports.start = function (q) {
  logger('queue-maintenance start')
  if (maintenanceId) {
    return true
  }
  const interval = q.maintenanceInterval * 60 * 1000
  maintenanceId = setInterval(() => {
    return reviewStalledJobs(q)
  }, interval)
  return true
}

module.exports.stop = function (q) {
  if (maintenanceId) {
    clearInterval(maintenanceId)
  }
}

module.exports.runOnce = reviewStalledJobs
