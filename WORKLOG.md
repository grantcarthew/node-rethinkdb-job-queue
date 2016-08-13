# WORKLOG

Check for invalid priority values for job options.

## Update events in tests to support x of y

*   queue-process.spec Done!

## Notes for documentation

Job parsing errors have a custom property err.dbError.

The next() function returns a promise with the number of running jobs.

Jobs can be cancelled by adding properties to the err object in next(err).

dateRetry gets updated on progress updates, use to stop a job timing out.

Queue.ready() returns false if the queue has been detached from the database.

Reviewed event has an object for args that includes reviewed and removed jobs.

if using createJob(number) will need to map `q.createJob(jobsToCreate).map(j => j.setPayload(testData))`

Write about the different Queue status and Job status values.
