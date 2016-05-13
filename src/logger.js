module.exports = function (message) {
  if (process.env.rjqDEBUG) {
    message = '[rethinkdb-job-queue] ' + message
    console.log(message)
  }
}
