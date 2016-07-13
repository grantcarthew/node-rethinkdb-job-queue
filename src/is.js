const logger = require('./logger')(module)
const moment = require('moment')
const enums = require('./enums')
const uuidRegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

module.exports.object = function isObject (value) {
  logger(`isObject`, value)
  return Object.prototype.toString.call(value) === '[object Object]'
}

const isNumber = module.exports.number = function isNumber (value) {
  logger(`isNumber`, value)
  return Object.prototype.toString.call(value) === '[object Number]'
}

const isBoolean = module.exports.boolean = function isBoolean (value) {
  logger(`isBoolean`, value)
  return Object.prototype.toString.call(value) === '[object Boolean]'
}

module.exports.true = function isTrue (value) {
  logger(`isTrue`, value)
  return isBoolean(value) && value === true
}

module.exports.false = function isFalse (value) {
  logger(`isFalse`, value)
  return isBoolean(value) && value === false
}

module.exports.date = function isDate (value) {
  logger(`isDate`, value)
  return moment.isDate(value)
}

const isUuid = module.exports.uuid = function isUuid (value) {
  logger(`isUuid`, value)
  return uuidRegExp.test(value)
}

const isNan = module.exports.nan = function isNan (value) {
  logger(`isNan`, value)
  return !isNumber(value) || value !== value
}

module.exports.integer = function isInteger (value) {
  logger(`isInteger`, value)
  return isNumber(value) && !isNan(value) && value % 1 === 0
}

module.exports.array = function isArray (value) {
  logger(`isArray`, value)
  return Array.isArray(value)
}

module.exports.job = function isJob (value) {
  logger(`isJob`, value)
  if (!value) { return false }
  if (!value.id) { return false }
  if (!isUuid(value.id)) { return false }
  if (!value.queueId) { return false }
  if (!moment.isDate(value.dateCreated)) { return false }
  if (!isNumber(value.priority) &&
      !Object.keys(enums.priority).includes(value.priority)) { return false }
  if (!Object.keys(enums.status).includes(value.status)) { return false }
  return true
}
