# Worklog

Need tests for the following;
queue-get-job
queue-remove-job
queue-reset
queue
queue-process
queue-stop
queue-delete
update dbResult test


## Tests Needed

queue-changefeed
queue-change
db-queue

queue
queue-process

## List of Changes and Events

*   Queue ready
*   Queue error
*   Queue paused
*   Queue resumed
*   Queue review
*   Job added to queue
*   Log added to job
*   Job status change
*   Job enqueue (event)
*   Job waiting
*   Job active (event and db change)
*   Job progress (event and db change)
*   Job removed
*   Job completed
*   Job timeout
*   Job failed
*   Job retry
*   Job delayed ???
*   Queue empty or reset

## Retry Workflow

### On Worker....

Timeout = 30sec
Job starts
Job takes longer than 30sec
Job timed out.
Cancel work.
check retry max and count and update;
  status
  priority
  retryCount
retry job.

### On Queue...

Review timed out jobs;
  checks active, dateStarted, timeout value.
If now > dateStarted + timeout + buffervalue??? then job failed;
  check retrymax and count and update status.

## TODO

db-result tests need to include array????  need to check types of data passed
Consider a function to remove jobs after a time period (week? month? 6 months?)
Name all functions exported
Check enums...
Check .emit(
Check database return values (prevent the change/update results from being returned to the user)
