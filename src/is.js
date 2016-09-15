const logger = require('./logger')(module)
const enums = require('./enums')
const uuidRegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isObject (value) {
  logger(`isObject`, value)
  return Object.prototype.toString.call(value) === '[object Object]'
}
module.exports.object = isObject

function isFunction (value) {
  logger(`isFunction`, value)
  return Object.prototype.toString.call(value) === '[object Function]'
}
module.exports.function = isFunction

function isString (value) {
  logger(`isString`, value)
  return Object.prototype.toString.call(value) === '[object String]'
}
module.exports.string = isString

function isNumber (value) {
  logger(`isNumber`, value)
  return Object.prototype.toString.call(value) === '[object Number]'
}
module.exports.number = isNumber

function isBoolean (value) {
  logger(`isBoolean`, value)
  return Object.prototype.toString.call(value) === '[object Boolean]'
}
module.exports.boolean = isBoolean

function isTrue (value) {
  logger(`isTrue`, value)
  return isBoolean(value) && value === true
}
module.exports.true = isTrue

function isFalse (value) {
  logger(`isFalse`, value)
  return isBoolean(value) && value === false
}
module.exports.false = isFalse

function isDate (value) {
  logger(`isDate`, value)
  return value instanceof Date ||
    Object.prototype.toString.call(value) === '[object Date]'
}
module.exports.date = isDate

function isDateBefore (testDate, refDate) {
  return refDate.valueOf() > testDate.valueOf()
}
module.exports.dateBefore = isDateBefore

function isDateAfter (testDate, refDate) {
  return refDate.valueOf() < testDate.valueOf()
}
module.exports.dateAfter = isDateAfter

function isDateBetween (testDate, startDate, finishDate) {
  return isDateAfter(testDate, startDate) && isDateBefore(testDate, finishDate)
}
module.exports.dateBetween = isDateBetween

function isUuid (value) {
  logger(`isUuid`, value)
  return uuidRegExp.test(value)
}
module.exports.uuid = isUuid

function isNan (value) {
  logger(`isNan`, value)
  return Number.isNaN(value)
}
module.exports.nan = isNan

function isInteger (value) {
  logger(`isInteger`, value)
  return isNumber(value) && !isNan(value) && value % 1 === 0
}
module.exports.integer = isInteger

function isArray (value) {
  logger(`isArray`, value)
  return Array.isArray(value)
}
module.exports.array = isArray

function isJob (value) {
  logger(`isJob`, value)
  if (!value) { return false }
  if (!value.id) { return false }
  if (!isUuid(value.id)) { return false }
  if (!value.queueId) { return false }
  if (!isDate(value.dateCreated)) { return false }
  if (!isNumber(value.priority) &&
      !Object.keys(enums.priority).includes(value.priority)) { return false }
  if (!Object.keys(enums.status).includes(value.status)) { return false }
  return true
}
module.exports.job = isJob

function isStatus (job, status) {
  if (!isJob(job)) { return false }
  if (job.status === status) { return true }
  return false
}

module.exports.active = function isActive (job) {
  return isStatus(job, enums.status.active)
}

module.exports.completed = function isCompleted (job) {
  return isStatus(job, enums.status.completed)
}

module.exports.cancelled = function isCancelled (job) {
  return isStatus(job, enums.status.cancelled)
}

module.exports.failed = function isFailed (job) {
  return isStatus(job, enums.status.failed)
}

module.exports.terminated = function isTerminated (job) {
  return isStatus(job, enums.status.terminated)
}
