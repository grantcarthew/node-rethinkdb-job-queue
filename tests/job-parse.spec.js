const test = require('tap').test
const is = require('../src/is')
const jobParse = require('../src/job-parse')
const Job = require('../src/job')
const uuid = require('uuid')

jobParseTests()
function jobParseTests () {
  test('job-parse', (t) => {
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
    const mockQueue = { id: uuid.v4(), name: 'fake' }
    let job = new Job(mockQueue)
    t.throws(() => { jobParse.job({}) }, 'Throws error if not a valid job for id')
    t.ok(is.array(jobParse.job()), 'Null or undefined returns an array')
    t.equal(jobParse.job().length, 0, 'Null or undefined returns an empty array')
    t.ok(is.array(jobParse.job(job)), 'Single job returns an Array')
    t.equal(jobParse.job(job).length, 1, 'Single job returns one item in an array')
    t.ok(is.uuid(jobParse.job(job)[0].id), 'Single job returns one valid job in an Array')

    // ---------- Parse Array of Jobs ----------
    t.comment('job-parse: Parse Job Array')
    let jobs = [
      new Job(mockQueue),
      new Job(mockQueue),
      new Job(mockQueue)
    ]
    let jobsResult = jobParse.job(jobs)
    t.ok(is.array(jobsResult), 'Array of jobs returns an array')
    t.equal(jobsResult.length, 3, 'Array of jobs returns valid number of items')
    t.ok(is.uuid(jobsResult[0].id), 'Array of jobs returns valid jobs')

    // ---------- Parse Invalid Job ----------
    t.comment('job-parse: Parse Invalid Job')
    job = new Job(mockQueue)
    job.id = 'not an id'
    t.throws(() => { jobParse.job(job) }, 'Invalid job id throws an exception')
    job = new Job(mockQueue)
    job.q = null
    t.throws(() => { jobParse.job(job) }, 'Invalid job queue throws an exception')
    job = new Job(mockQueue)
    job.priority = null
    t.throws(() => { jobParse.job(job) }, 'Invalid job priority throws an exception')
    job = new Job(mockQueue)
    job.timeout = -1
    t.throws(() => { jobParse.job(job) }, 'Invalid job timeout throws an exception')
    job = new Job(mockQueue)
    job.retryDelay = -1
    t.throws(() => { jobParse.job(job) }, 'Invalid job retryDelay throws an exception')
    job = new Job(mockQueue)
    job.retryMax = -1
    t.throws(() => { jobParse.job(job) }, 'Invalid job retryMax throws an exception')
    job = new Job(mockQueue)
    job.retryCount = -1
    t.throws(() => { jobParse.job(job) }, 'Invalid job retryCount throws an exception')
    job = new Job(mockQueue)
    job.status = null
    t.throws(() => { jobParse.job(job) }, 'Invalid job status throws an exception')
    job = new Job(mockQueue)
    job.log = {}
    t.throws(() => { jobParse.job(job) }, 'Invalid job log throws an exception')
    job = new Job(mockQueue)
    job.dateCreated = {}
    t.throws(() => { jobParse.job(job) }, 'Invalid job dateCreated throws an exception')
    job = new Job(mockQueue)
    job.dateEnable = {}
    t.throws(() => { jobParse.job(job) }, 'Invalid job dateEnable throws an exception')
    job = new Job(mockQueue)
    job.progress = 101
    t.throws(() => { jobParse.job(job) }, 'Invalid job progress throws an exception')
    job = new Job(mockQueue)
    job.queueId = null
    t.throws(() => { jobParse.job(job) }, 'Invalid job queueId throws an exception')
  })
}
