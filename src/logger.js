const path = require('path')
const datetime = require('./datetime')
const debug = require('debug')
module.exports = function logger (rjqModule) {
  if (process.env.DEBUG) {
    const time = datetime.format(new Date())
    const moduleName = path.basename(rjqModule.id, '.js')
    let prefix = `[${time}][${moduleName}]`
    return debug(prefix)
  } else {
    return () => {}
  }
}
