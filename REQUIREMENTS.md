# Requirements Document for `rethinkdb-job-queue`

This document lists the requirements for the `rethinkdb-job-queue` (also referred to as `rjq`) node package.
It exists to help with the development of the package and writing unit tests.

## Function Statement

`rethinkdb-job-queue` will record and facilitate the processing of jobs or tasks using one or more worker nodes. It will allow reporting on job status changes and detecting failures.

## Requirements List

### Queue Creation

Allow the creation of a `Queue` object that connects to a `RethinkDB` database.
If the database connection details and name are not supplied `rjq` should connect to the `localhost` and create the database and queue table.

### Queue Tear Down

Allow the removing of the `Queue` including deleting the `Queue` backing table from `RethinkDB`.

### Job Creation

Create `Job` objects used to hold the data or job information. These jobs will be persisted back to the `RethinkDB` database to allow for long running tasks and provide reliability.

### Job Processing

Allow the owning `Node` worker process to supply a job `function` providing `rjq` with the logic to process the job to completion. Job processing shall support priority jobs and running jobs concurrently.

### Job Reporting

Provide events and logs to allow all nodes to know the status of `Queues` and `Jobs`.

### Job Failure

Detect and report on failures in the job processing based on the following list;

*   Handling `function` internal failure.
*   Handling `function` external failure.
*   Handling `function` timeout.
*   Worker node unresponsive (stalled).

### Job Completion

Allow completion of job processing by worker nodes which may include removing the job from the database.
