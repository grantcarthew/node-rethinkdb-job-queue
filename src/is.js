const moment = require('moment')
const enums = require('./enums')
const jobParse = require('./job-parse')
const uuidRegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const isNumber = module.exports.number = function isNumber (value) {
  return Object.prototype.toString.call(value) === '[object Number]'
}

module.exports.boolean = function isBoolean (value) {
  return Object.prototype.toString.call(value) === '[object Boolean]'
}

module.exports.date = function idDate (value) {
  return moment(value).isDate()
}

const isUuid = module.exports.uuid = function isUuid (value) {
  return uuidRegExp.test(value)
}

const isNan = module.exports.nan = function isNan (value) {
  return !isNumber(value) || value !== value
}

module.exports.integer = function isInteger (value) {
  return isNumber(value) && !isNan(value) && value % 1 === 0
}

module.exports.array = function isArray (value) {
  return Array.isArray(value)
}

module.exports.job = function isJob (value) {
  if (!value) { return false }
  if (!value.id) { return false }
  if (!isUuid(value.id)) { return false }
  if (!value.queueId) { return false }
  if (!moment.isDate(value.dateCreated)) { return false }
  if (!isNumber(value.priority)) { return false }
  if (!Object.keys(enums.status).includes(value.status)) { return false }
  return true
}
