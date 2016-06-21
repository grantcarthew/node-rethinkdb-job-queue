# Queue API

<a name="queue" />

## `Queue(options, dbConfig)`

__Returns__: A new job `Queue` JavaScript object.

The `Queue(options, dbConfig)` function can be called multiple times to create multiple job queues connected to multiple instances of RethinkDB.

The `options` and `dbConfig` parameters are optional. See the table below.

Both the `options` and `dbConfig` are passed to the `Queue(options, dbConfig)` function as JavaScript `objects`.

If the `dbName` database does not exist, it will be created.

### Queue `options`

|Key            |Description                                                          |Defaults    |
|---------------|---------------------------------------------------------------------|------------|
|`queueName`    |Name of the queue                                                    |rjqJobQueue |
|`stallInterval`|Maximum working time in seconds before the job is considered stalled |30          |

### Database `dbConfig`

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

## `create(queueName)`

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
