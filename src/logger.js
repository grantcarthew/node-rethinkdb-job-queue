module.exports = function (message) {
  if (typeof process.env.NODE_ENV === 'undefined' ||
    process.env.NODE_ENV === 'development') {
    message = '[rethinkdb-job-queue] ' + message
    console.log(message)
  }
}
