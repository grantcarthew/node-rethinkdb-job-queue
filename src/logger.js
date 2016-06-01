const path = require('path')
const moment = require('moment')
const debug = require('debug')
module.exports = function (rjqModule) {
  if (process.env.DEBUG) {
    const time = moment().format('HH:mm:ss.SSS')
    const moduleName = path.basename(rjqModule.id, '.js')
    let prefix = `[${time}][${moduleName}]`
    return debug(prefix)
  } else {
    return () => {}
  }
}
