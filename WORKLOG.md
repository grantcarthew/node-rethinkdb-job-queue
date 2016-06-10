# Worklog



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

Name all functions exported
Check enums...
Check .emit(
Check database return values (prevent the change/update results from being returned to the user)
