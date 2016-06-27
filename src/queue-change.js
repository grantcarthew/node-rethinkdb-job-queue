const logger = require('./logger')(module)
const enums = require('./enums')
const Job = require('./job')
const dbResult = require('./db-result')

module.exports = function queueChange (q, err, change) {
  logger('queueChange')
  const newData = change.new_val
  const oldData = change.old_val

  // Prevent any change processing if change is caused by this queue
  if (newData && newData.queueId === q.id ||
      !newData && oldData && oldData.queueId === q.id) { return }

  console.log('------------- QUEUE CHANGE -------------')
  console.dir(change)
  console.log('----------------------------------------')

  if (err) { throw new Error(err) }

  // New job added
  if (newData && !oldData) {
    q.emit(enums.queueStatus.enqueue, dbResult.toJob(q, change))
    //this.handler(newJob) TODO
  }



  // Status change
  // if (change &&
  //     change.new_val &&
  //     change.old_val &&
  //     change.new_val.status !== change.old_val.status) {
  //       switch (change.new_val.status) {
  //         case enums.queueStatus.completed:
  //           q.emit(enums.queueStatus.completed)
  //           break;
  //         default:
  //
  //       }
  //       q.emit()
  //     }
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
