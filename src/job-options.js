const logger = require('./logger')(module)
const defaultOptions = {
  priority: 'normal',
  timeout: 300,
  retryMax: 3,
  retryDelay: 600
}

module.exports = function jobOptions (options = {}) {
  logger('options', options)
  return {
    priority: options.priority || defaultOptions.priority,
    timeout: options.timeout || defaultOptions.timeout,
    retryMax: options.retryMax || defaultOptions.retryMax,
    retryDelay: options.retryDelay || defaultOptions.retryDelay
  }
}
