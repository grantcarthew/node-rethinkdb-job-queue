const moment = require('moment')
const enums = require('./enums')

module.exports = function (q) {
  let timeoutDate = moment().add(-1, 'minutes').toDate()

  return q.r.table(q.name)
  .between(q.r.now(), q.r.maxval, { index: enums.indexes.active }).run()
  return q.r.table(q.name).getAll('active', {index: 'status'}).filter((job) => {
    return job('dateCreated').gt(stallTestDate)
  }).run()
}
