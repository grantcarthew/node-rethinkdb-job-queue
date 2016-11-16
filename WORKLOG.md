# WORKLOG

## Working On

Add repeat job testing to queue tests.


## TODO

*   Check out repeat and retry and how they interoperate.
*   test `processCount` in job-log createLog.
*   `Queue.getNextJob` need to test processCount update.
*   `job.setRepeat` and `job.setRepeatDelay` need testing.
*   `completed` event needs repeating to be tested
*   `job-completed` needs repeated job tests.
*   need to create `setRepeat` and `setRepeatDelay` methods and test.
*   add `idle` event test to `Queue.process` and `Queue.change`.
*   `Event.reset` signature changed to add q.id and totalRemoved, test and doc.
*   global queue reset, reviewed, error event?
*   Add processCount to all log entries.
*   Add failedCount???
