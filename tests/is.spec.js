const test = require('tape')
const moment = require('moment')
const uuid = require('node-uuid')
const is = require('../src/is')
const enums = require('../src/enums')

module.exports = function () {
  test('is', (t) => {
    t.plan(51)

    const job = {
      id: uuid.v4(),
      queueId: 'queue id string',
      dateCreated: moment().toDate(),
      priority: enums.priority.normal,
      status: enums.status.created
    }

    t.ok(is.object({}), 'Is object true with object')
    t.notOk(is.object(''), 'Is object false with string')
    t.ok(is.function(function () {}), 'Is function true with function')
    t.notOk(is.function({}), 'Is function false with object')
    t.ok(is.string(''), 'Is string true with string')
    t.notOk(is.string({}), 'Is string false with object')
    t.ok(is.number(1.1), 'Is number true with decimal')
    t.ok(is.number(1), 'Is number true with integer')
    t.notOk(is.number({}), 'Is number false with object')
    t.ok(is.boolean(true), 'Is boolean true with true')
    t.ok(is.boolean(false), 'Is boolean true with false')
    t.notOk(is.boolean(''), 'Is boolean false with string')
    t.ok(is.true(true), 'Is true true with true')
    t.notOk(is.true(false), 'Is true false with false')
    t.notOk(is.true(1), 'Is true false with integer 1')
    t.ok(is.false(false), 'Is false true with false')
    t.notOk(is.false(true), 'Is false false with true')
    t.notOk(is.false(0), 'Is false false with integer 0')
    t.ok(is.date(new Date()), 'Is date true with new Date()')
    t.notOk(is.date(moment()), 'Is date false with moment()')
    t.notOk(is.date({}), 'Is date false with object')
    t.ok(is.uuid(uuid.v4()), 'Is uuid true with uuid')
    t.notOk(is.uuid('1234'), 'Is uuid false with string of numbers')
    t.notOk(is.uuid({}), 'Is uuid false with object')
    t.ok(is.nan(Number.NaN), 'Is nan true with Number.NaN')
    t.notOk(is.nan(1), 'Is nan false with integer 1')
    t.notOk(is.nan({}), 'Is nan false with object')
    t.ok(is.integer(1), 'Is integer true with integer 1')
    t.notOk(is.integer(1.1), 'Is integer false with decimal')
    t.notOk(is.integer({}), 'Is integer false with object')
    t.ok(is.array([]), 'Is array true with array')
    t.notOk(is.array(1), 'Is array false with integer 1')
    t.notOk(is.array({}), 'Is array false with object')
    t.ok(is.job(job), 'Is job true with mock job')
    t.notOk(is.job(), 'Is job false with null')
    job.id = null
    t.notOk(is.job(job), 'Is job false with null job id')
    job.id = '1234'
    t.notOk(is.job(job), 'Is job false with invalid job id')
    job.id = uuid.v4()
    job.queueId = null
    t.notOk(is.job(job), 'Is job false with null queueId')
    job.queueId = '1234'
    job.dateCreated = {}
    t.notOk(is.job(job), 'Is job false with invalid dateCreated')
    job.dateCreated = moment().toDate()
    job.priority = 40
    t.ok(is.job(job), 'Is job true with priority a number')
    job.priority = enums.priority.normal
    job.status = 'not a real status'
    t.notOk(is.job(job), 'Is job false with invalid status')
    job.status = enums.status.created
    t.notOk(is.active(job), 'Is active false with invalid status')
    job.status = enums.status.active
    t.ok(is.active(job), 'Is active true with active status')
    t.notOk(is.completed(job), 'Is completed false with invalid status')
    job.status = enums.status.completed
    t.ok(is.completed(job), 'Is completed true with completed status')
    t.notOk(is.cancelled(job), 'Is cancelled false with invalid status')
    job.status = enums.status.cancelled
    t.ok(is.cancelled(job), 'Is cancelled true with cancelled status')
    t.notOk(is.failed(job), 'Is failed false with invalid status')
    job.status = enums.status.failed
    t.ok(is.failed(job), 'Is failed true with failed status')
    t.notOk(is.terminated(job), 'Is terminated false with invalid status')
    job.status = enums.status.terminated
    t.ok(is.terminated(job), 'Is terminated true with terminated status')
  })
}
