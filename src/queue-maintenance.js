const moment = require('moment')

module.exports = function (q) {
  let stallTestDate = moment().add(-1, 'minutes').toDate()

  return q.r.table(q.name).getAll('active', {index: 'status'}).filter((job) => {
    return job('dateCreated').gt(stallTestDate)
  }).run()
}
