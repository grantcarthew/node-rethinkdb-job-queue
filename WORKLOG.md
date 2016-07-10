# WORKLOG

Need tests for the following;
is tests
add active, added, failed, terminated event tests throughout
add more error events?
queue-change
queue
queue-process addHandler when the q is not the master.
Consider a function to remove jobs after a time period
Consider enable/disable changefeed.
update indexInactivePriorityDateCreated index

Non-events;
created: 'created': Not needed
waiting: 'waiting': Not needed
timeout: 'timeout': ???



Check database return values (prevent the change/update results from being returned to the user)
check array return types
check for more places to add logs

## Final Checks

-   Name all functions
-   Check enums usage
-   Check index usage
-   Search for "TODO"
