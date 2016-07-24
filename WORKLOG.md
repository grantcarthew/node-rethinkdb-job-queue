# WORKLOG

Test return value from ready()

Need tests for the following;

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
dateRetry gets updated on progress updates, use to stop a job timing out.
