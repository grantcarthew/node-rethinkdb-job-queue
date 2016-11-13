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

function ensureDate (value) {
  logger(`ensureDate`, value)
  return isDate(value) ? value : new Date(value)
}

function isDateBefore (testDate, refDate) {
  logger('isDateBefore', testDate, refDate)
  testDate = ensureDate(testDate)
  refDate = ensureDate(refDate)
  return refDate.valueOf() > testDate.valueOf()
}
module.exports.dateBefore = isDateBefore

function isDateAfter (testDate, refDate) {
  logger('isDateAfter', testDate, refDate)
  testDate = ensureDate(testDate)
  refDate = ensureDate(refDate)
  return refDate.valueOf() < testDate.valueOf()
}
module.exports.dateAfter = isDateAfter

function isDateBetween (testDate, aDate, bDate) {
  logger('isDateBetween', testDate, aDate, bDate)
  aDate = ensureDate(aDate)
  bDate = ensureDate(bDate)
  const earlyDate = aDate > bDate ? bDate : aDate
  const laterDate = aDate > bDate ? aDate : bDate
  return isDateAfter(testDate, earlyDate) && isDateBefore(testDate, laterDate)
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

function isError (value) {
  logger('isError', value)
  return value instanceof Error
}
module.exports.error = isError

function isLog (value) {
  logger('isLog', value)
  if (!value) { return false }
  if (!isDate(value.date)) { return false }
  if (!isString(value.queueId)) { return false }
  if (!isString(value.type)) { return false }
  if (!isString(value.status)) { return false }
  return true
}
module.exports.log = isLog

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
  logger('isStatus', job, status)
  if (!isJob(job)) { return false }
  if (job.status === status) { return true }
  return false
}

module.exports.repeating = function isRepeating (job) {
  logger('isRepeating', job)
  if (isTrue(job.repeat)) {
    return true
  }
  if (isInteger(job.repeat) &&
      job.repeat > 0 &&
      job.repeatCount < job.repeat) {
    return true
  }
  return false
}

module.exports.active = function isActive (job) {
  logger('isActive', job)
  return isStatus(job, enums.status.active)
}

module.exports.completed = function isCompleted (job) {
  logger('isCompleted', job)
  return isStatus(job, enums.status.completed)
}

module.exports.cancelled = function isCancelled (job) {
  logger('isCancelled', job)
  return isStatus(job, enums.status.cancelled)
}

module.exports.failed = function isFailed (job) {
  logger('isFailed', job)
  return isStatus(job, enums.status.failed)
}

module.exports.terminated = function isTerminated (job) {
  logger('isTerminated', job)
  return isStatus(job, enums.status.terminated)
}
