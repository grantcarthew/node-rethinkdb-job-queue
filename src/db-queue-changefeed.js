const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const dbReview = require('./db-review')

module.exports = function (q) {
  logger('start')
  return q.r.db(q.db).table(q.name)
  .changes().run().then((changeFeed) => {
    q._changeFeed = changeFeed
    changeFeed.each((err, change) => {
      q._onChange(err, change)
    })
  })
}
