const logger = require('./logger')

module.exports.changeFeed = function (q) {
  return q.r.db(q.db).table(q.name)
    .changes().run().then((feed) => {
      feed.each(q.onMessage).bind(q)
    })
}

module.exports.deleteTable = function (r, db) {
  return r.dbDrop(db).run()
}

module.exports.commitJobs = function (job) {
  return job.q.r.db(job.q.db).table(job.q.name).insert(job.generalize()).run()
}
