const logger = require('./logger')(module)
const moment = require('moment')
const enums = require('./enums')
const jobLog = require('./job-log')

module.exports = function (q) {
  if (updateResult.errors > 0) {
    return Promise.reject(updateResult)
  }
  return updateResult.changes
  }).map((change) => {
  return job.q.createJob(null, change.new_val)
  })
}
