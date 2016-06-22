const test = require('tape')
const jobParse = require('../src/job-parse')
const Job = require('../src/job')
const uuid = require('node-uuid')
const isUuid = require('isuuid')
const testData = require('./test-options').testData

module.exports = function () {
  test('job-parse test', (t) => {
    t.plan(23)

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
    const mix = ids.concat(objWithIds)
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
    t.ok(Array.isArray(mixResult), 'Array of object.ids returns an array')
    t.equal(mixResult.length, 6, 'Array of object.ids returns valid number of items')
    t.ok(isUuid(mixResult[0]), 'Array of object.ids returns valid ids')

    // ---------- Parse Jobs ----------
    const fakeQueue = { id: uuid.v4(), name: 'fake' }
    const job = new Job(fakeQueue, testData)
    t.throws(() => { jobParse.job({}) }, 'Throws error if not a valid job for id')
    t.ok(Array.isArray(jobParse.job()), 'Null or undefined returns an array')
    t.equal(jobParse.job().length, 0, 'Null or undefined returns an empty array')
    t.ok(Array.isArray(jobParse.job(job)), 'Single job returns an Array')
    t.equal(jobParse.job(job).length, 1, 'Single job returns one valid job in an Array')


  })
}
