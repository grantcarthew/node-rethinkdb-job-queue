# Introduction

`rethinkdb-job-queue` is a persistent job or task queue backed by [RethinkDB][rethinkdb-url].
It has been build as an alternative to using a [Redis][redis-url] backed job queue such as [Kue][kue-url], [Bull][bull-url], or [Bee-Queue][bee-queue-url].

[![bitHound Overall Score][bithound-overall-image]][bithound-overall-url]
[![bitHound Dependencies][bithound-dep-image]][bithound-dep-url]
[![Build Status][travisci-image]][travisci-url]
[![js-standard-style][js-standard-image]][js-standard-url]

[![Thinker][thinker-image]][rjq-github-url]

[![NPM][nodei-npm-image]][nodei-npm-url]

Please __Star__ on GitHub / NPM and __Watch__ for updates.

## Documentation

__Warning:__ This is early days for `rethinkdb-job-queue`. The API will change and documentation is sparse. That said, there are over 1100 integration tests and it is fully functional.

For full documentation of the `rethinkdb-job-queue` package, please see the [wiki][rjq-wiki-url]

## Quick Start

### Installation

```sh
npm install rethinkdb-job-queue --save
```

### E-Mail Job Example

```js

const Queue = require('rethinkdb-job-queue')
const options = {
  db: 'JobQueue', // The name of the database in RethinkDB
  name: 'RegistrationEmailJobs', // The name of the table in the database
  host: 'localhost',
  port: 28015,
  master: true, // Enable database review
  masterInterval: 300, // Database review period in seconds
  changeFeed: true, // Enables events from the database table
  concurrency: 100,
  removeFinishedJobs: 30, // true, false, or number of days.
}
const q = new Queue(options)
const jobDefaults = {
  priority: 'normal',
  timeout: 300,
  retryMax: 3, // Four attempts, first then three retries
  retryDelay: 600 // Time in seconds to delay retries
}
q.jobOptions = jobDefaults

// The createJob method will only create the job locally.
// It will need to be added to the queue.
const job = q.createJob().setPayload('batman@batcave.com')

q.process((job, next) => {
  // Send email using job.data as the destination address
  someEmailPackage.send(job.data).then((result) => {
    next(null, sendResult)
  }).catch((err) => {
    next(err)
  })
})

return q.addJob(job).then((savedJobs) => {
  // savedJobs is an array of the jobs added with updated properties
}).catch((err) => {
  console.error(err)
})

```

## Contributing

1.  Fork it!
2.  Create your feature branch: `git checkout -b my-new-feature`
3.  Commit your changes: `git commit -am 'Add some feature'`
4.  Push to the branch: `git push origin my-new-feature`
5.  Submit a pull request :D

## Credits

Thanks to the following marvelous packages and people for their hard work:

-   The [RethinkDB][rethinkdb-url] team for the great database.
-   The RethinkDB driver [rethinkdbdash][rethinkdbdash-url] by [Michel][neumino-url]
-   The Promise library [Bluebird][bluebird-url] by [Petka Antonov][petka-url].
-   The date management library [moment][moment-url].
-   The UUID package [node-uuid][uuid-url] by [Robert Kieffer][broofa-url].


This list could go on...

## License

MIT

[redis-url]: http://redis.io/
[kue-url]: http://automattic.github.io/kue/
[bull-url]: https://github.com/OptimalBits/bull
[bee-queue-url]: https://github.com/LewisJEllis/bee-queue
[rethinkdb-url]: http://www.rethinkdb.com/
[rethinkdbdash-url]: https://github.com/neumino/rethinkdbdash
[neumino-url]: https://github.com/neumino
[rjq-github-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue
[rjq-wiki-url]: https://github.com/grantcarthew/node-rethinkdb-job-queue/wiki
[thinker-image]: https://cdn.rawgit.com/grantcarthew/node-rethinkdb-job-queue/master/thinkerjoblist.png
[bluebird-url]: https://github.com/petkaantonov/bluebird
[petka-url]: https://github.com/petkaantonov
[moment-url]: http://momentjs.com/
[uuid-url]: https://github.com/broofa/node-uuid
[broofa-url]: https://github.com/broofa
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
