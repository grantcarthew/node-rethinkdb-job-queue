# WORKLOG

Working on new index.

check for dateFailed/dateCompleted/dateTimeout values
Need tests for the following;
is tests
add active, added, failed, terminated event tests throughout
add more error events?
queue-change
queue
queue-process addHandler when the q is not the master.
Consider a function to remove jobs after a time period
update indexInactivePriorityDateCreated index, look for specific status

Non-events;
created: 'created': Not needed



Check database return values (prevent the change/update results from being returned to the user)
check array return types
check for more places to add logs

## Final Checks

-   Name all functions
-   Check enums usage
-   Check index usage
-   Search for "TODO"
