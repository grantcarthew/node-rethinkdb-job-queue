const logger = require('./logger')(module)
const defaultOptions = {
  priority: 'normal',
  timeout: 10, // TODO: change back to 300 for default
  retryMax: 3,
  retryDelay: 600
}

module.exports = function (options = {}) {
  logger('options', options)
  return {
    priority: options.priority || defaultOptions.priority,
    timeout: options.timeout || defaultOptions.timeout,
    retryMax: options.retryMax || defaultOptions.retryMax,
    retryDelay: options.retryDelay || defaultOptions.retryDelay
  }
}
