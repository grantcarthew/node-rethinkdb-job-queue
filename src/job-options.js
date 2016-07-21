const logger = require('./logger')(module)
const enums = require('./enums')

module.exports = function jobOptions (options = {}) {
  logger('jobOptions', options)
  if (!options) { options = {} } // options = {} not being set in parameters
  return {
    priority: options.priority || enums.priorityFromValue(40),
    timeout: options.timeout || enums.options.timeout,
    retryMax: options.retryMax || enums.options.retryMax,
    retryDelay: options.retryDelay || enums.options.retryDelay
  }
}
