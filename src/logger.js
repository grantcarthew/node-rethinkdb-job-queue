const path = require('path')
module.exports.init = function (rjqModule) {
  return function (message) {
    if (process.env.rjqDEBUG) {
      const moduleName = path.basename(rjqModule.id, '.js')
      message = `[rethinkdb-job-queue][${moduleName}] ${message || ''}`
      console.log(message)
    }
  }
}
