const test = require('tape')
const is = require('../src/is')
const Queue = require('../src/queue')
const jobParse = require('../src/job-parse')
const uuid = require('uuid')
const tOpts = require('./test-options')

module.exports = function () {
  test('job-parse', (t) => {
    t.plan(42)

    const q = new Queue(tOpts.cxn(), tOpts.default())
    const ids = [
      uuid.v4(),
      uuid.v4(),
      uuid.v4()
    ]
    const idsResult = jobParse.id(ids)
    const objWithIds = [
      {id: uuid.v4()},
      {id: uuid.v4()},
      {id: uuid.v4()}
    ]
    const objWithIdsResult = jobParse.id(ids)
    const mix = [...ids, ...objWithIds]
    const mixResult = jobParse.id(mix)

    // ---------- Parse Ids ----------
    t.comment('job-parse: Parse Ids')
    t.throws(() => { jobParse.id({}) }, 'Throws error if not a valid job for id')
    t.ok(is.array(jobParse.id()), 'Null or undefined returns an array')
    t.equal(jobParse.id().length, 0, 'Null or undefined returns an empty array')
    t.ok(is.array(jobParse.id(uuid.v4())), 'Single id returns an array')
    t.equal(jobParse.id(uuid.v4()).length, 1, 'Single id returns one item in an array')
    t.ok(is.uuid(jobParse.id(uuid.v4())[0]), 'Single id returns one valid id in an array')
    t.ok(is.array(jobParse.id({id: uuid.v4()})), 'Single object.id returns an array')
    t.equal(jobParse.id({id: uuid.v4()}).length, 1, 'Single object.id returns one item in an array')
    t.ok(is.uuid(jobParse.id({id: uuid.v4()})[0]), 'Single object.id returns one valid id in an array')
    t.ok(is.array(idsResult), 'Array of ids returns an array')
    t.equal(idsResult.length, 3, 'Array of ids returns valid number of items')
    t.ok(is.uuid(idsResult[0]), 'Array of ids returns valid ids')
    t.ok(is.array(objWithIdsResult), 'Array of object.ids returns an array')
    t.equal(objWithIdsResult.length, 3, 'Array of object.ids returns valid number of items')
    t.ok(is.uuid(objWithIdsResult[0]), 'Array of object.ids returns valid ids')
    t.ok(is.array(mixResult), 'Array of mixed objects and ids returns an array')
    t.equal(mixResult.length, 6, 'Array of mixed objects and ids returns valid number of items')
    t.ok(is.uuid(mixResult[0]), 'Array of mixed objects and ids returns valid ids')

    // ---------- Parse Single Job ----------
    t.comment('job-parse: Parse Single Job')
    let job = q.createJob()
    t.ok(is.array(jobParse.job(q, {})), 'Object returns an array')
    t.ok(jobParse.job(q, {}).length === 1, 'Object returns one item in an array')
    t.ok(is.job(jobParse.job(q, {})[0]), 'Object returns valid job in an array')
    t.ok(is.array(jobParse.job(q)), 'Null or undefined returns an array')
    t.equal(jobParse.job(q).length, 0, 'Null or undefined returns an empty array')
    t.ok(is.array(jobParse.job(q, job)), 'Single job returns an Array')
    t.equal(jobParse.job(q, job).length, 1, 'Single job returns one item in an array')
    t.ok(is.uuid(jobParse.job(q, job)[0].id), 'Single job returns one valid job in an Array')

    // ---------- Parse Array of Jobs ----------
    t.comment('job-parse: Parse Job Array')
    let jobs = [
      q.createJob(),
      q.createJob(),
      q.createJob()
    ]
    let jobsResult = jobParse.job(q, jobs)
    t.ok(is.array(jobsResult), 'Array of jobs returns an array')
    t.equal(jobsResult.length, 3, 'Array of jobs returns valid number of items')
    t.ok(is.uuid(jobsResult[0].id), 'Array of jobs returns valid jobs')

    // ---------- Parse Invalid Job ----------
    t.comment('job-parse: Parse Invalid Job')
    job = q.createJob()
    job.id = 'not an id'
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job id returns job with data')
    job = q.createJob()
    job.q = null
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job queue returns job with data')
    job = q.createJob()
    job.priority = null
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job priority returns job with data')
    job = q.createJob()
    job.timeout = -1
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job timeout returns job with data')
    job = q.createJob()
    job.retryDelay = -1
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job retryDelay returns job with data')
    job = q.createJob()
    job.retryMax = -1
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job retryMax returns job with data')
    job = q.createJob()
    job.retryCount = -1
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job retryCount returns job with data')
    job = q.createJob()
    job.status = null
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job status returns job with data')
    job = q.createJob()
    job.log = {}
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job log returns job with data')
    job = q.createJob()
    job.dateCreated = {}
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job dateCreated returns job with data')
    job = q.createJob()
    job.dateEnable = {}
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job dateEnable returns job with data')
    job = q.createJob()
    job.progress = 101
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job progress returns job with data')
    job = q.createJob()
    job.queueId = null
    t.ok(is.job(jobParse.job(q, job)[0]), 'Invalid job queueId returns job with data')

    q.stop()
    t.end()
  })
}
