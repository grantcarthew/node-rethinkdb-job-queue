const logger = require('./logger')(module)
const moment = require('moment')
const enums = require('./enums')
const uuidRegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

module.exports.object = function isObject (value) {
  logger(`isObject`, value)
  return Object.prototype.toString.call(value) === '[object Object]'
}

module.exports.function = function isFunction (value) {
  logger(`isFunction`, value)
  return Object.prototype.toString.call(value) === '[object Function]'
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
  return Number.isNaN(value)
}

module.exports.integer = function isInteger (value) {
  logger(`isInteger`, value)
  return isNumber(value) && !isNan(value) && value % 1 === 0
}

module.exports.array = function isArray (value) {
  logger(`isArray`, value)
  return Array.isArray(value)
}

const isJob = module.exports.job = function isJob (value) {
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
