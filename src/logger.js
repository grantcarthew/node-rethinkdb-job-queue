const path = require('path')
const moment = require('moment')
const debug = require('debug')
module.exports.init = function (rjqModule) {
    if (process.env.DEBUG) {
      const time = moment().format('HH:mm:ss.SSS')
      const moduleName = path.basename(rjqModule.id, '.js')
      let prefix = `[rethinkdb-job-queue] ${moduleName}`
      //console.log(message)
      return debug(prefix)
    }
}
