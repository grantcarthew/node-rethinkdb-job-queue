const logger = require('./logger')

module.exports.changeFeed = function () {
  console.log(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');
  console.dir(this)
  return this.r.db(this.db).table(this.name)
  .changes().run().then((feed) => {
    feed.each(this.onMessage.bind(this))
  })
}

module.exports.deleteTable = function (r, db) {
  return r.dbDrop(db).run()
}

module.exports.commitJobs = function (job) {
  return job.q.r.db(job.q.db).table(job.q.name).insert(job.generalize()).run()
}

module.exports.getNextJob = function (q, concurrency) {
  concurrency = concurrency || 0
  return q.r
    .db(q.db)
    .table(q.name)
    .orderBy(q.enums.indexes.priorityAndDateCreated)
    .nth(concurrency)
    .default({})
    .run()
}

module.exports.registerQueueChangeFeed = function (q) {
  return q.r.table(q.name)
  .changes().run().then((feed) => {
    feed.each(q.onMessage.bind(q))
  })
}
