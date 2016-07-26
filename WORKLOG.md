# WORKLOG

Add t.end() to tests.
Change review event to reviewed
Finish queue tests, not closing
Add test queue to each test.

Refactor tests for event pattern.

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
Queue.ready() returns false if the queue has been detached from the database.
Reviewed event has an object for args that includes reviewed and removed jobs.
