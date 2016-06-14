# Introduction

`rethinkdb-job-queue` is a persistent job or task queue backed by RethinkDB.

[![bitHound Overall Score][bithound-overall-image]][bithound-overall-url]
[![bitHound Dependencies][bithound-dep-image]][bithound-dep-url]
[![Build Status][travisci-image]][travisci-url]
[![js-standard-style][js-standard-image]][js-standard-url]

[![Thinker][thinker-image]][rethinkdb-job-queue-url]

# Do Not Use - Under Heavy Development

[![NPM][nodei-npm-image]][nodei-npm-url]

Please __Star__ on GitHub / NPM and __Watch__ for updates.

## Topics

-   [Quick Start](#quick-start)
-   [Rationale](#rationale)
-   [Function](#function)
-   [Performance](#performance)
-   [Requirements](#requirements)
-   [Installation](#installation)
-   [API](#api)
    -   [queue](#queue)
    -   [create](#create)
-   [Plans](#plans)
-   [Testing](#testing)
-   [Contributing](#contributing)
-   [History](#history)
-   [Credits](#credits)
-   [License](#license)

## Quick Start

### TODO

## Rationale

### TODO

## Function

### Orphaned Jobs (Master Queue)

During normal queue operation, worker nodes processing jobs will detect when a job has taken too long and is operating past its `timeout` value.

However, if a queue worker node fails for any reason whilst working on a job, the job will not complete and will remain in the database with an `active` status.

To ensure the job is not forgotten, `rethinkdb-job-queue` has an option called `isMaster` you can pass when creating a queue. The `isMaster` option defaults to `true` if not supplied. There should be at least one master node per queue.

When a queue node is a master, it will review the queue backing table based on the `masterReviewPeriod` option which defaults to `300` seconds or 5 minutes.

When the master node reviews the queue backing table, it looks for jobs that are `active` and past their review timeout value which is different to the job `timeout` value.

The review timeout value is calculated from the following formula;

```js
 job.dateStarted + job.timeout + 60
 ```

The extra `60` seconds is to allow a functioning queue worker node to detect when a job has timed out and update it prior to the master review.

If a job is `active` and the current time is past the review timeout, the job is updated to a `retry` status and the priority is set to `retry` (a stored value of 1) which is the highest priority. The jobs `retryCount` value does not get incremented because the worker node failed.

It is worth noting that the database review process is called when the `queue.process()` function is first called. This means that if you don't have a master queue, orphaned jobs will still be updated on process restart.

### TODO

## Requirements

### TODO

## Installation

```sh
npm install rethinkdb-job-queue --save
```
## Queue Events

Events raised by the Queue object.

### `ready`

__Returns__: null

Raised when the backing database, table, and indexes are ready for use.

### `enqueue`

__Returns__:

### `completed`

__Returns__:

### `retry`

__Returns__:

### `failed`

__Returns__:

### `review`

__Returns__: `Number` The number of jobs updated from `active` status to `timeout` or `failed`.

Raised when the database review process completes.

### `detached`

__Returns__: `undefined`

## API

<a name="queue" />

### `Queue(options, dbConfig)`

__Returns__: A new job `Queue` JavaScript object.

The `Queue(options, dbConfig)` function can be called multiple times to create multiple job queues connected to multiple instances of RethinkDB.

The `options` and `dbConfig` parameters are optional. See the table below.

Both the `options` and `dbConfig` are passed to the `Queue(options, dbConfig)` function as JavaScript `objects`.

If the `dbName` database does not exist, it will be created.

#### Queue `options`

|Key            |Description                                                          |Defaults    |
|---------------|---------------------------------------------------------------------|------------|
|`queueName`    |Name of the queue                                                    |rjqJobQueue |
|`stallInterval`|Maximum working time in seconds before the job is considered stalled |30          |

#### Database `dbConfig`

|Key            |Description                                        |Defaults    |
|---------------|---------------------------------------------------|------------|
|`host`         |Name or IP address of the RethinkDB server         |localhost   |
|`port`         |TCP port number for the RethinkDB server instance  |28015       |
|`db`           |The name of the database to hold the job queues    |rjqJobQueue |

Example using defaults:

```js
const jobQueue = require('rethinkdb-job-queue')

// Connects to the local instance of RethinkDB with the following defaults.
// Database host: localhost
// Database port: 28015
// Database name: rjqJobQueue
// Queue Name: rjqJobQueue
const queue = jobQueue()
// Now use the 'queue' object to create jobs.

```

Example using `dbName` and `queueName`:

```js
// Connects to the local instance of RethinkDB.
const dbConfig = {
  db: 'AppMail'
}
const options = {
  queueName: 'NewsLetterJobs'
}
const newsLetterQueue = jobQueue(options, dbConfig)
// Now use the 'newsLetterQueue' object to create jobs.

```

Example connecting to a remote RethinkDB instance:

```js
// Connects to a remote instance of RethinkDB.
const dbConfig = {
  host: '192.168.1.5',
  port: '4000',
  db: 'AppProd'
}
const options = {
  queueName: 'ProcessJobs'
}
const processJobsQueue = jobQueue(options, dbConfig)
// Now use the 'processJobsQueue' object to create jobs.

```

<a name="create" />

### `create(queueName)`

__Returns__: Promise resolving to a `Queue` object.

Once you have a queue factory returned from the `connect(options)` function, you can call `create(queueName)` to create the job queue.

The options are passed to the `create()` function as a JavaScript object. None of the options are required.

A table inside the `connected` database will be created for each queue based on the `queueName` option.

|Key            |Description                                                          |Defaults |
|---------------|---------------------------------------------------------------------|---------|
|`queueName`    |Name (or reason) of the queue                                        |JobQueue |
|`stallInterval`|Maximum working time in seconds before the job is concidered stalled |30       |

```js
const jobQueue = require('rethinkdb-job-queue')
const localQFactory = jobQueue.connect()
const emailJobQOptions = {
  queueName: 'EmailJobQueje'
}
var emailJobQueue = {}

localQFactory.create(emailJobQueue).then((newQueue) => {
  // Use the new job queue to start queuing jobs.
  emailJobQueue = newQueue
}).catch(console.error)
```

### TODO

## Testing

### TODO

## Contributing

1.  Fork it!
2.  Create your feature branch: `git checkout -b my-new-feature`
3.  Commit your changes: `git commit -am 'Add some feature'`
4.  Push to the branch: `git push origin my-new-feature`
5.  Submit a pull request :D

## History

### TODO

## Credits

Thanks to the following marvelous people for their hard work:
-   The [RethinkDB][rethinkdb-url] team for the great database.


### TODO

This list could go on...

## License

MIT

[rethinkdb-url]: http://www.rethinkdb.com/
[rethinkdb-job-queue]: https://github.com/grantcarthew/node-rethinkdb-job-queue
[thinker-image]: https://cdn.rawgit.com/grantcarthew/node-rethinkdb-job-queue/master/thinkerjoblist.svg
[bluebird-url]: https://github.com/petkaantonov/bluebird
[bluebird-speed-url]: http://programmers.stackexchange.com/questions/278778/why-are-native-es6-promises-slower-and-more-memory-intensive-than-bluebird
[petka-url]: https://github.com/petkaantonov
[bithound-overall-image]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue/badges/score.svg
[bithound-overall-url]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue
[bithound-dep-image]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue/badges/dependencies.svg
[bithound-dep-url]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue/master/dependencies/npm
[bithound-code-image]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue/badges/code.svg
[bithound-code-url]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue
[js-standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[js-standard-url]: http://standardjs.com/
[nodei-npm-image]: https://nodei.co/npm/rethinkdb-job-queue.png?downloads=true&downloadRank=true&stars=true
[nodei-npm-url]: https://nodei.co/npm/rethinkdb-job-queue/
[travisci-image]: https://travis-ci.org/grantcarthew/node-rethinkdb-job-queue.svg?branch=master
[travisci-url]: https://travis-ci.org/grantcarthew/node-rethinkdb-job-queue
[tape-url]: https://www.npmjs.com/package/tape
