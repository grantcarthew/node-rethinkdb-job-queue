module.exports = function (
logDate,
queueId,
logType,
status,
queueMessage,
duration,
jobData,
err) {
  if (err) {
    queueMessage = `${queueMessage}: ${err.message}`
  }
  return {
    logDate,
    queueId,
    logType,
    status,
    queueMessage,
    duration,
    jobData
  }
}
