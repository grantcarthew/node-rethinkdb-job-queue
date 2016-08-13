# `rethinkdb-job-queue` Change log

## v0.0.4 / 2016-08

*   Removed 'retry' job priority.

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
