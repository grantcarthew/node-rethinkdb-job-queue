# WORKLOG

Working on new index.

Need tests for the following;
dbResult.toIds
job-failed with q.removeFinishedJobs = true
job-completed with q.removeFinishedJobs = true
queue-cancel-job with q.removeFinishedJobs = true (done returning ids)
ensure returned values are always arrays
check returned promise on next() call 'next().then()...'
check returned jobs on queue for remove etc.
change job-failed return to id rather than job
is tests
add active, added, failed, terminated event tests throughout
add more error events?
queue-change
queue
queue-process addHandler when the q is not the master.

Tests: dbResult.toIds

Consider a function to remove jobs after a time period

update indexInactivePriorityDateCreated index, look for specific status

Non-events;
created: 'created': Not needed



Check database return values (prevent the change/update results from being returned to the user)
check array return types
check for more places to add logs
add logger statements

## Final Checks

-   Name all functions
-   Check enums usage
-   Check index usage
-   Search for "TODO"

## Notes for documentation
Job parsing errors have a custom property err.dbError
