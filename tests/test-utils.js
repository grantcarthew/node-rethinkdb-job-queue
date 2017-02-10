module.exports.simulateJobProcessing = function (q) {
  q._running = 1
  setTimeout(function setRunningToZero () {
    q._running = 0
  }, 500)
}
