const EventEmitter = require('events').EventEmitter
const uuid = require('node-uuid')
const moment = require('moment')
const jobMessages = require('./job-messages')

class Job extends EventEmitter {

  constructor (data, options) {
    super()

    options = options || {}

    // If creating a job from the database, pass the job data as the options.
    // Eg. new Job(null, jobData)
    if (options.id) {
      Object.assign(this, options)
    } else {
      let now = moment().toDate()
      this.id = uuid.v4()
      this.data = data || {}
      this.progress = 0
      this.retryCount = 0
      this.retryDelay = options.retryDelay || 0
      this.retryMax = options.retryMax > 0 ? options.retryMax : 0
      this.timeout = options.timeout > 0 ? options.timeout : 0
      this.status = 'active'
      this.log = []
      this.dateCreated = now
      this.dateModified = now
      this.dateFailed
      this.dateStarted
      this.dateHeartbeat = now
      this.dateStalled
      this.duration
      this.priority = options.priority || 'normal'
      this.workerId
    }
  }

  enableEvents (q) {
    return q.ready.then(() => {
      return q.r.table(q.name).get(this.id)
      .changes().run().then((feed) => {
        feed.each((err, change) => {
          jobMessages(err, change).bind(this)
        })
      })
    })
  }
}

module.exports = Job
