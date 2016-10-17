# `rethinkdb-job-queue` Change log

## v1.0.1 / 2016-10-17

*   Fixed `removeFinishedJobs = false` bug.
*   Upgraded  Babel transpiling to [babel-preset-latest](http://babeljs.io/docs/plugins/preset-latest/).

## v1.0.0 / 2016-10-12

*   `Job.update` now adds log entry automatically.
*   Bump to v1.0.0 to support SemVer.

## v0.5.1 / 2016-10-11

*   Dependencies updated.
*   'Job updated' message added.
*   Updated job-add-log module tests.

## v0.5.0 / 2016-10-10

*   Removed `Job.createLog` method.
*   Changed `Job.addLog` signature.
*   Changed `Job.update` signature.
*   `next(error)` stringifies error to `Job.log[].data`.

## v0.4.4 / 2016-10-07

*   Fixed `dateEnable` value when job failed is called.

## v0.4.3 / 2016-10-07

*   Added default log message when data added.
*   Fixed multiple Queue Masters in the same Node.js process.
*   Fixed `queue-summary` query picking up the `State Document`.
*   Fixed `Queue.id` to include database name.

## v0.4.2 / 2016-10-05

*   Added `Queue.findJob` raw option and tests.
*   `db-review` now changes state document state value to `reviewed`.
*   `queue-change` restarts processing on state document `reviewed` state.

## v0.4.1 / 2016-10-03

*   Improved Job constructor to support arrays.
*   Fixed masterInterval option parsing.

## v0.4.0 / 2016-09-30

*   Added `is.log` to the `is` module.
*   Added `Job.setPriority`, `Job.setTimeout`, `Job.setRetryMax`, `Job.setRetryDelay`, `setDateEnable`.
*   Added string, object, or log arguments to `Job.addLog`.
*   Changed `Queue.createJob` API to support data objects, values and options.

## v0.3.0 / 2016-09-28

*   Added global queue pause.
*   Fixed tests for global queue pause.

## v0.2.1 / 2016-09-27

*   Added `Queue.findJob()` method.

## v0.2.0 / 2016-09-27

*   Extended failed job `dateCreated` value in queue-process tests.
*   Added worker stops processing on global `cancelled` event.
*   Refactored `Queue.process`.

## v0.1.2 / 2016-09-20

*   Documentation updated.
*   Tests updated.

## v0.1.1 / 2016-09-19

*   Added the `job-update` module.
*   Added `job.update()` method.
*   Changed `added` job status to `waiting`.

## v0.1.0 / 2016-09-16

*   Added `db-driver` module for connection testing.
*   Changed `Queue()` constructor API to add connection options.
*   Standardized time related options to milliseconds.
*   Added `datetime` module to add and format dates.
*   Updated `is` module to include `dateBefore`, `dateAfter`, `dateBetween`.
*   Removed the `moment` library.

## v0.0.8 / 2016-09-09

*   Replaced `node-uuid` dependency with `uuid` package.
*   Renamed `dateRetry` to `dateEnable`.
*   Updated `is.date()` to remove `moment.isDate()`.
*   Added `Delayed Job` tests to queue-process tests.

## v0.0.7 / 2016-08-23

*   Fixed `next()` calls.
*   Minor refactor.
*   README updated.

## v0.0.6 / 2016-08-23

*   Changed the `next()` function signature.
*   Added `catch()` to `next()` Promise.
*   README updated.

## v0.0.5 / 2016-08-21

*   Changed return values of `Queue.removeJob` to job ids.
*   Removed the `Queue.connection` alias property.
*   Added the `pausing` Queue event.
*   Updated examples to work with the `next()` Promise.
*   Fixed a require path in `queue-add-job`.

## v0.0.4 / 2016-08-18

*   Removed `retry` job priority.
*   Added process timeout extender when progress updated.
*   Added `priorityAsString` to `Job.getCleanCopy`.
*   Fixed `job-options` so it keeps current if only one supplied.
*   Removed `Job.setPayload`.
*   Switched to using `Map()` for queue-process job timeouts.

## v0.0.3 / 2016-08-12

*   Removed `master` Queue options, only using `masterInterval`.
*   `masterInterval` default options changed from 300 sec to 310.
*   Internal parameter rename from `job` or `jobId` to `jobOrId`.
*   Updated README with better examples.

## v0.0.2 / 2016-08-01

*   Removed data from `Queue.createJob()`.
*   Added the `Job.setPayload()` method.

## v0.0.1 / 2016-07-27

*   Initial publish to npm.
*   Changes expected.
