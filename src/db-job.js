const Promise = require('bluebird')
const moment = require('moment')
const logger = require('./logger')
const enums = require('./enums')

module.exports.setStatus = function (q, status) {
  this.q.setStatus(this.status, status).then((statusResult) => {
    console.log('STATUS RESULT++++++++++++++++++++++++++++++++++++++')
    console.dir(statusResult)
  })
}
