# WORKLOG

## Working On

job-completed has been updated to support repeat jobs.
Working on fixing tests. Specifically fixing queue-stop to remove event listeners
added by queue-process. I think this is what is causing issues with 'queue' tests
not completing.


## TODO

*   `completed` event needs repeating to be tested
*   `job-completed` needs repeated job tests.
*   need to create `setRepeat` and `setRepeatDelay` methods and test.
*   add `idle` event test to `Queue.process` and `Queue.change`.
*   `Event.reset` signature changed to add q.id and totalRemoved, test and doc.
*   global queue reset, reviewed, error event?
