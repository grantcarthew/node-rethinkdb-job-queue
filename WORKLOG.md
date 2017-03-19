# WORKLOG

## Working On

change of plans. Now adding a limitJobLogs queue option
- queue.js limitJobLogs option has been added.
- enums have option and logsTruncated message.
- Need to extend job-completed.js to remove logs past the limit value.
- Tests need padding out for both queue.js and job-completed.js

## Scratch Pad

function truncateLogs (job, noOfLogEntriesToRetain) {
  logger('truncateLogs', noOfLogEntriesToRetain)
  if (job.log.length <= noOfLogEntriesToRetain) {
    return Promise.resolve(true)
  }

  const totalToRetain = noOfLogEntriesToRetain + 1
  const newLog = createLogObject(job,
    `Retaining ${noOfLogEntriesToRetain} log entries`,
    enums.message.jobLogsTruncated,
    enums.log.information,
    job.status)

  return Promise.resolve().then(() => {
    return job.q.r.db(job.q.db)
    .table(job.q.name)
    .get(job.id)
    .update({
      log: job.q.r.row('log').slice(-totalToRetain).append(newLog),
      queueId: job.q.id
    })
  }).then((updateResult) => {
    job.log.sort(compareTime)
    job.log = job.log.slice(-totalToRetain)
    job.log.push(newLog)
    logger(`Event: log`, job.q.id, job.id)
    job.q.emit(enums.status.log, job.q.id, job.id)
    return true
  })
}


        // ---------- Truncate Log Tests ----------
        t.comment('job-log: Truncate Log')
        return jobLog.truncateLogs(job, 3)
      }).then((updateResult4) => {
        t.ok(updateResult4, 'Logs truncated successfully')
        t.equal(job.log.length, 3, 'Local job logs truncated successfully')
        return q.getJob(job.id)
      }).then((jobWithLog5) => {
        console.dir(jobWithLog5[0].log)
        t.equal(jobWithLog5[0].log.length, 3, 'Logs truncated in database successfully')
        t.equal(jobWithLog5[0].getLastLog().date.toString(), job.getLastLog().date.toString(), 'Last log equal local and database log')
        t.equal(jobWithLog5[0].getLastLog().message, job.getLastLog().message, 'Last log message equal local and database')
