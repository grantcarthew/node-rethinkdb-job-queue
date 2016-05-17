const Job = require('./job')

module.exports.onQueueChange = function (err, change) {
    console.log('------------- QUEUE CHANGE -------------')
    //console.dir(change)
    console.log('----------------------------------------')

    if (err) { throw new Error(err) }

    // New job added
    if (change && change.new_val && !change.old_val) {
      let newJob = new Job(null, change.new_val)
      this.emit('enqueue', newJob)
      this.handler(newJob)
    }
    return

    message = JSON.parse(message)
    if (message.event === 'failed' || message.event === 'retrying') {
      message.data = Error(message.data)
    }

    this.emit('job ' + message.event, message.id, message.data)

    if (this.jobs[message.id]) {
      if (message.event === 'progress') {
        this.jobs[message.id].progress = message.data
      } else if (message.event === 'retrying') {
        this.jobs[message.id].options.retries -= 1
      }

      this.jobs[message.id].emit(message.event, message.data)

      if (message.event === 'succeeded' || message.event === 'failed') {
        delete this.jobs[message.id]
      }
    }
  }
