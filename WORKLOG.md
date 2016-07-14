# WORKLOG

Add pause Promise?
change .running to ._running and add getter (others?)
update dateRetry on progress.
Merge enums message error

Need tests for the following;
is tests
queue-change
queue

add more error events?

## Final Checks

-   Name all functions
-   Check enums usage
-   Check index usage
-   Search for "TODO"

## Notes for documentation
Job parsing errors have a custom property err.dbError
next() returns a promise with the number of running jobs
Jobs can be cancelled by adding properties to the err object in next(err)
