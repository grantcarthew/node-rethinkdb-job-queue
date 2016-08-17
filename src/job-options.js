const logger = require('./logger')(module)
const enums = require('./enums')
const is = require('./is')

module.exports = function jobOptions (newOptions = {}, oldOptions = {}) {
  logger('jobOptions', newOptions, oldOptions)

  const finalOptions = {}
  finalOptions.priority = enums.options.priority
  finalOptions.timeout = enums.options.timeout
  finalOptions.retryMax = enums.options.retryMax
  finalOptions.retryDelay = enums.options.retryDelay

  if (Object.keys(enums.priority).includes(oldOptions.priority)) {
    finalOptions.priority = oldOptions.priority
  }

  if (is.integer(oldOptions.timeout) && oldOptions.timeout >= 0) {
    finalOptions.timeout = oldOptions.timeout
  }

  if (is.integer(oldOptions.retryMax) && oldOptions.retryMax >= 0) {
    finalOptions.retryMax = oldOptions.retryMax
  }

  if (is.integer(oldOptions.retryDelay) && oldOptions.retryDelay >= 0) {
    finalOptions.retryDelay = oldOptions.retryDelay
  }

  if (Object.keys(enums.priority).includes(newOptions.priority)) {
    finalOptions.priority = newOptions.priority
  }

  if (is.integer(newOptions.timeout) && newOptions.timeout >= 0) {
    finalOptions.timeout = newOptions.timeout
  }

  if (is.integer(newOptions.retryMax) && newOptions.retryMax >= 0) {
    finalOptions.retryMax = newOptions.retryMax
  }

  if (is.integer(newOptions.retryDelay) && newOptions.retryDelay >= 0) {
    finalOptions.retryDelay = newOptions.retryDelay
  }

  return finalOptions
}
