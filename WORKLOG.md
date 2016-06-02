# Worklog

Working on heartbeat...

Two states: timeout = 0, timeout > 0

If timeout = 0, timeout is disabled. heartbeat mech required.
If timeout > 0, timeout is enabled. heartbeat mech not required.

On Worker....
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

On Queue...
Review timed out jobs;
  checks active, dateStarted, timeout value.
If now > dateStarted + timeout + buffervalue??? then job failed;
  check retrymax and count and update status.




# TODO

Fix dbReview
Check joblog format on all files.
Check enums...
Add job.log()
