const path = require('path')
const moment = require('moment')
module.exports.init = function (rjqModule) {
  return function (message) {
    if (process.env.rjqDEBUG) {
      const time = moment().format('HH:mm:ss.SSS')
      const moduleName = path.basename(rjqModule.id, '.js')
      message = `[rethinkdb-job-queue][${time}][${moduleName}] ${message || ''}`
      console.log(message)
    }
  }
}
