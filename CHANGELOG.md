# `rethinkdb-job-queue` Change log

## v0.1.2 / 2016-09-20

*   Documentation updated.
*   Tests updated.

## v0.1.1 / 2016-09-19

*   Added the 'job-update' module.
*   Added 'job.update()' method.
*   Changed 'added' job status to 'waiting'.

## v0.1.0 / 2016-09-16

*   Added 'db-driver' module for connection testing.
*   Changed 'Queue()' constructor API to add connection options.
*   Standardized time related options to milliseconds.
*   Added 'datetime' module to add and format dates.
*   Updated 'is' module to include dateBefore, dateAfter, dateBetween.
*   Removed the 'moment' library.

## v0.0.8 / 2016-09-09

*   Replaced `node-uuid` dependency with `uuid` package.
*   Renamed `dateRetry` to `dateEnable`.
*   Updated `is.date()` to remove `moment.isDate()`.
*   Added 'Delayed Job' tests to queue-process tests.

## v0.0.7 / 2016-08-23

*   Fixed next() calls.
*   Minor refactor.
*   README updated.

## v0.0.6 / 2016-08-23

*   Changed the next() function signature.
*   Added catch() to next() Promise.
*   README updated.

## v0.0.5 / 2016-08-21

*   Changed return values of Queue.removeJob to job ids.
*   Removed the Queue.connection alias property.
*   Added the 'pausing' Queue event.
*   Updated examples to work with the next() Promise.
*   Fixed a require path in queue-add-job.

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
