# Introduction

`rethinkdb-job-queue` is a persistent job or task queue backed by [RethinkDB][rethinkdb-url].
It has been built as an alternative to the many queues available on [NPM][npm-search-url].

[![bitHound Overall Score][bithound-overall-image]][bithound-overall-url]
[![bitHound Dependencies][bithound-dep-image]][bithound-dep-url]
[![bitHound Dependencies][bithound-code-image]][bithound-code-url]
[![js-standard-style][js-standard-image]][js-standard-url]
[![NSP Status][nsp-image]][nsp-url]

[![Thinker][thinker-image]][rjq-github-url]

[![NPM][nodei-npm-image]][nodei-npm-url]

Please __Star__ on GitHub / NPM and __Watch__ for updates.

## Features

*   Powered by [RethinkDB][rethinkdb-url]
*   Connect to [multiple databases][queue-connection-url]
*   Create [multiple queues][queue-connection-url]
*   [Distributed worker nodes (PubSub)][queue-pubsub-url]
*   Global [queue events][queue-events-url]
*   Global [job cancellation][job-cancel-url]
*   Global [pause queue][queue-pause-url]
*   Run [concurrent jobs][queue-concurrency-url]
*   Promise based with minimal callbacks
*   [Priority processing of jobs][job-priority-url]
*   [Job progress updates][job-progress-url]
*   [Delayed job start][job-delayed-url]
*   [Find jobs in the queue][find-job-url]
*   [Determine job uniqueness][find-job-by-name-url]
*   [Job timeout][job-timeout-url]
*   [Retrying failed jobs][job-retry-url]
*   [Repeatable jobs][job-repeat-url]
*   [Job reanimation][job-reanimation-url]
*   [Job Editing][job-editing-url]
*   Rich job [history log][job-log-url]
*   TypeScript definitions included
*   Over 2000 [integration tests][testing-url]

[queue-connection-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Queue-Connection
[queue-events-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Queue-Events
[queue-concurrency-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Queue-Options#queue-concurrency-option
[queue-pubsub-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Queue-PubSub
[job-priority-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Job-Options#job-priority-option
[job-progress-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Job.updateProgress
[job-delayed-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Delayed-Job
[find-job-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Queue.findJob
[find-job-by-name-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Queue.findJobByName
[job-cancel-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Queue.process#failed-job-with-cancel
[queue-pause-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Queue.pause
[job-timeout-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Job-Options#job-timeout-option
[job-retry-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Job-Retry
[job-repeat-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Job.repeat
[job-reanimation-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Queue.reanimateJob
[job-editing-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Job-Editing
[job-log-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Job.log
[testing-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Testing

## Documentation

*   [Full Documentation][rjq-wiki-url]
*   [Change Log][rjq-changelog-url]
*   [Code Coverage Report][rjq-coverage-url] from more than 2000 Integration Tests

## Quick Start

### Installation

__Note:__ You will need to install [RethinkDB][rethinkdb-url] before you can use `rethinkdb-job-queue`.

```sh
npm install rethinkdb-job-queue --save
```

See the [installation document](https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Installation) for supported Node.js versions and workarounds.

### Simple Example

```js

const Queue = require('rethinkdb-job-queue')
const qOptions = {
  name: 'Mathematics' // The queue and table name
}
const cxnOptions = {
  db: 'JobQueue', // The name of the database in RethinkDB
}

const q = new Queue(cxnOptions, qOptions)

const job = q.createJob({
  numerator: 123,
  denominator: 456
})

q.process((job, next) => {
    try {
      let result = job.numerator / job.denominator
      // Do something with your result
      return next(null, result)
    } catch (err) {
      console.error(err)
      return next(err)
    }
})

return q.addJob(job).catch((err) => {
  console.error(err)
})

```

### E-Mail Job Example using [nodemailer][nodemailer-url]

```js

// The following is not related to rethinkdb-job-queue.
// This is the nodemailer configuration
const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
  service: 'Mailgun',
  auth: {
    user: 'postmaster@superheros.com',
    pass: 'your-api-key-here'
  }
})

// Setup e-mail data with unicode symbols
var mailOptions = {
  from: '"Registration" <support@superheros.com>', // Sender address
  subject: 'Registration', // Subject line
  text: 'Click here to complete your registration', // Plaintext body
  html: '<b>Click here to complete your registration</b>' // HTML body
}

// rethinkdb-job-queue configuration
const Queue = require('rethinkdb-job-queue')

// Queue options have defaults and are not required
const qOptions = {
  name: 'RegistrationEmail', // The queue and table name
  masterInterval: 310000, // Database review period in milliseconds
  changeFeed: true, // Enables events from the database table
  concurrency: 100,
  removeFinishedJobs: 2592000000, // true, false, or number of milliseconds
}

// Connection options have defaults and are not required
// You can replace these options with a rethinkdbdash driver object
const cxnOptions = {
  host: 'localhost',
  port: 28015,
  db: 'JobQueue', // The name of the database in RethinkDB
}

// This is the main queue instantiation call
const q = new Queue(cxnOptions, qOptions)

// Customizing the default job options for new jobs
q.jobOptions = {
  priority: 'normal',
  timeout: 300000,
  retryMax: 3, // Four attempts, first then three retries
  retryDelay: 600000 // Time in milliseconds to delay retries
}

const job = q.createJob()
// The createJob method will only create the job locally.
// It will need to be added to the queue.
// You can decorate the job with any data to be saved for processing
job.recipient = 'batman@batcave.com'

q.process((job, next) => {
  // Send email using job.recipient as the destination address
  mailOptions.to = job.recipient
  return transporter.sendMail(mailOptions).then((info) => {
    console.dir(info)
    return next(null, info)
  }).catch((err) => {
    // This catch is for nodemailer sendMail errors.
    return next(err)
  })
})

return q.addJob(job).then((savedJobs) => {
  // savedJobs is an array of the jobs added with updated properties
}).catch((err) => {
  console.error(err)
})

```

## About the Owner

I, Grant Carthew, am a technologist, trainer, and Dad from Queensland, Australia. I work on code in a number of personal projects and when the need arises I build my own packages.

This project exists because there were no functional job queues built on the RethinkDB database. I wanted an alternative to the other job queues on NPM.

Everything I do in open source is done in my own time and as a contribution to the open source community.

See my [other projects on NPM](https://www.npmjs.com/~grantcarthew).

## Contributing

1.  Fork it!
2.  Create your feature branch: `git checkout -b my-new-feature`
3.  Commit your changes: `git commit -am 'Add some feature'`
4.  Push to the branch: `git push origin my-new-feature`
5.  Submit a pull request :D

Please see the [debugging](https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Debugging) and [testing](https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Testing) documents for more detail.

## Credits

Thanks to the following marvelous packages and people for their hard work:

-   The [RethinkDB][rethinkdb-url] team for the great database.
-   The RethinkDB driver [rethinkdbdash][rethinkdbdash-url] by [Michel][neumino-url]
-   The Promise library [Bluebird][bluebird-url] by [Petka Antonov][petka-url].
-   The [uuid][uuid-url] package.

This list could go on...

## License

MIT

[npm-search-url]: https://npms.io/search?q=job+queue
[rethinkdb-url]: http://www.rethinkdb.com/
[rethinkdbdash-url]: https://github.com/neumino/rethinkdbdash
[neumino-url]: https://github.com/neumino
[rjq-github-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue
[rjq-wiki-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki
[rjq-changelog-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki/Change-Log
[rjq-coverage-url]: https://rawgit.com/grantcarthew/site-rjq-coverage/master/lcov-report/src/index.html
[thinker-image]: https://cdn.rawgit.com/grantcarthew/node-rethinkdb-job-queue/master/thinkerjoblist.png
[nodemailer-url]: https://www.npmjs.com/package/nodemailer
[bluebird-url]: https://github.com/petkaantonov/bluebird
[petka-url]: https://github.com/petkaantonov
[uuid-url]: https://www.npmjs.com/package/uuid
[bithound-overall-image]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue/badges/score.svg
[bithound-overall-url]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue
[bithound-dep-image]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue/badges/dependencies.svg
[bithound-dep-url]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue/master/dependencies/npm
[bithound-code-image]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue/badges/code.svg
[bithound-code-url]: https://www.bithound.io/github/grantcarthew/node-rethinkdb-job-queue
[js-standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[js-standard-url]: http://standardjs.com/
[nsp-image]: https://nodesecurity.io/orgs/openjs/projects/3871d340-0ca9-471c-be9a-39df3871262d/badge
[nsp-url]: https://nodesecurity.io/orgs/openjs/projects/3871d340-0ca9-471c-be9a-39df3871262d
[nodei-npm-image]: https://nodei.co/npm/rethinkdb-job-queue.png?downloads=true&downloadRank=true&stars=true
[nodei-npm-url]: https://nodei.co/npm/rethinkdb-job-queue/
