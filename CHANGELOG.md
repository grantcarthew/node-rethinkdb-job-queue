# `rethinkdb-job-queue` Change log

## v0.0.5 / 2016-08

*   Changed return values of Queue.removeJob to job ids.
*   Removed the Queue.connection alias property.
*   Added the 'pausing' Queue event.
*   Updated examples to work with the next() Promise.

## v0.0.4 / 2016-08-18

*   Removed 'retry' job priority.
*   Added process timeout extender when progress updated.
*   Added priorityAsString to 'Job.getCleanCopy'.
*   Fixed job-options so it keeps current if only one supplied.
*   Removed Job.setPayload.
*   Switched to using Map() for queue-process job timeouts.

## v0.0.3 / 2016-08-12

*   Removed 'master' Queue options, only using 'masterInterval'.
*   masterInterval default options changed from 300 sec to 310.
*   Internal parameter rename from "job" or "jobId" to "jobOrId".
*   Updated README with better examples.

## v0.0.2 / 2016-08-01

*   Removed data from Queue.createJob().
*   Added the Job.setPayload() method.

## v0.0.1 / 2016-07-27

*   Initial publish to npm.
*   Changes expected.
