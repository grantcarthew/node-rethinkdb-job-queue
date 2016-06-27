const test = require('tape')
const jobParse = require('../src/job-parse')
const Job = require('../src/job')
const uuid = require('node-uuid')
const isUuid = require('isuuid')
const testData = require('./test-options').testData

module.exports = function () {
  test('job-parse test', (t) => {
    t.plan(40)

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
    t.throws(() => { jobParse.id({}) }, 'Throws error if not a valid job for id')
    t.ok(Array.isArray(jobParse.id()), 'Null or undefined returns an array')
    t.equal(jobParse.id().length, 0, 'Null or undefined returns an empty array')
    t.ok(Array.isArray(jobParse.id(uuid.v4())), 'Single id returns an array')
    t.equal(jobParse.id(uuid.v4()).length, 1, 'Single id returns one item in an array')
    t.ok(isUuid(jobParse.id(uuid.v4())[0]), 'Single id returns one valid id in an array')
    t.ok(Array.isArray(jobParse.id({id: uuid.v4()})), 'Single object.id returns an array')
    t.equal(jobParse.id({id: uuid.v4()}).length, 1, 'Single object.id returns one item in an array')
    t.ok(isUuid(jobParse.id({id: uuid.v4()})[0]), 'Single object.id returns one valid id in an array')
    t.ok(Array.isArray(idsResult), 'Array of ids returns an array')
    t.equal(idsResult.length, 3, 'Array of ids returns valid number of items')
    t.ok(isUuid(idsResult[0]), 'Array of ids returns valid ids')
    t.ok(Array.isArray(objWithIdsResult), 'Array of object.ids returns an array')
    t.equal(objWithIdsResult.length, 3, 'Array of object.ids returns valid number of items')
    t.ok(isUuid(objWithIdsResult[0]), 'Array of object.ids returns valid ids')
    t.ok(Array.isArray(mixResult), 'Array of mixed objects and ids returns an array')
    t.equal(mixResult.length, 6, 'Array of mixed objects and ids returns valid number of items')
    t.ok(isUuid(mixResult[0]), 'Array of mixed objects and ids returns valid ids')

    // ---------- Parse Single Job ----------
    const mockQueue = { id: uuid.v4(), name: 'fake' }
    let job = new Job(mockQueue, testData)
    t.throws(() => { jobParse.job({}) }, 'Throws error if not a valid job for id')
    t.ok(Array.isArray(jobParse.job()), 'Null or undefined returns an array')
    t.equal(jobParse.job().length, 0, 'Null or undefined returns an empty array')
    t.ok(Array.isArray(jobParse.job(job)), 'Single job returns an Array')
    t.equal(jobParse.job(job).length, 1, 'Single job returns one item in an array')
    t.ok(isUuid(jobParse.job(job)[0].id), 'Single job returns one valid job in an Array')

    // ---------- Parse Array of Jobs ----------
    let jobs = [
      new Job(mockQueue, testData),
      new Job(mockQueue, testData),
      new Job(mockQueue, testData)
    ]
    let jobsResult = jobParse.job(jobs)
    t.ok(Array.isArray(jobsResult), 'Array of jobs returns an array')
    t.equal(jobsResult.length, 3, 'Array of jobs returns valid number of items')
    t.ok(isUuid(jobsResult[0].id), 'Array of jobs returns valid jobs')

    // ---------- Parse Invalid Job ----------
    job = new Job(mockQueue, testData)
    job.id = 'not an id'
    t.throws(() => { jobParse.job(job) }, 'Invalid job id throws an exception')
    job = new Job(mockQueue, testData)
    job.q = null
    t.throws(() => { jobParse.job(job) }, 'Invalid job queue throws an exception')
    job = new Job(mockQueue, testData)
    job.priority = null
    t.throws(() => { jobParse.job(job) }, 'Invalid job priority throws an exception')
    job = new Job(mockQueue, testData)
    job.timeout = -1
    t.throws(() => { jobParse.job(job) }, 'Invalid job timeout throws an exception')
    job = new Job(mockQueue, testData)
    job.retryDelay = -1
    t.throws(() => { jobParse.job(job) }, 'Invalid job retryDelay throws an exception')
    job = new Job(mockQueue, testData)
    job.retryMax = -1
    t.throws(() => { jobParse.job(job) }, 'Invalid job retryMax throws an exception')
    job = new Job(mockQueue, testData)
    job.retryCount = -1
    t.throws(() => { jobParse.job(job) }, 'Invalid job retryCount throws an exception')
    job = new Job(mockQueue, testData)
    job.status = null
    t.throws(() => { jobParse.job(job) }, 'Invalid job status throws an exception')
    job = new Job(mockQueue, testData)
    job.log = {}
    t.throws(() => { jobParse.job(job) }, 'Invalid job log throws an exception')
    job = new Job(mockQueue, testData)
    job.dateCreated = {}
    t.throws(() => { jobParse.job(job) }, 'Invalid job dateCreated throws an exception')
    job = new Job(mockQueue, testData)
    job.dateRetry = {}
    t.throws(() => { jobParse.job(job) }, 'Invalid job dateRetry throws an exception')
    job = new Job(mockQueue, testData)
    job.progress = 101
    t.throws(() => { jobParse.job(job) }, 'Invalid job progress throws an exception')
    job = new Job(mockQueue, testData)
    job.queueId = null
    t.throws(() => { jobParse.job(job) }, 'Invalid job queueId throws an exception')
  })
}
