const logger = require('./logger')(module)
const enums = require('./enums')
const is = require('./is')

function defaultMissingOptions (options) {
  let priority = enums.options.priority
  let timeout = enums.options.timeout
  let retryMax = enums.options.retryMax
  let retryDelay = enums.options.retryDelay

  if (Object.keys(enums.priority).includes(options.priority)) {
    priority = options.priority
  }

  if (is.integer(options.timeout) && options.timeout >= 0) {
    timeout = options.timeout
  }

  if (is.integer(options.retryMax) && options.retryMax >= 0) {
    retryMax = options.retryMax
  }

  if (is.integer(options.retryDelay) && options.retryDelay >= 0) {
    retryDelay = options.retryDelay
  }

  return { priority, timeout, retryMax, retryDelay }
}

module.exports = function jobOptions (oldOptions = {}, newOptions = {}) {
  logger('jobOptions', oldOptions, newOptions)
  if (!newOptions) { newOptions = {} } // newOptions = {} not being set in parameters
  const returnOptions = defaultMissingOptions(oldOptions)

  if (Object.keys(enums.priority).includes(newOptions.priority)) {
    returnOptions.priority = newOptions.priority
  }

  if (is.integer(newOptions.timeout) && newOptions.timeout >= 0) {
    returnOptions.timeout = newOptions.timeout
  }

  if (is.integer(newOptions.retryMax) && newOptions.retryMax >= 0) {
    returnOptions.retryMax = newOptions.retryMax
  }

  if (is.integer(newOptions.retryDelay) && newOptions.retryDelay >= 0) {
    returnOptions.retryDelay = newOptions.retryDelay
  }

  return returnOptions
}
