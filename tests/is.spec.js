const test = require('tap').test
const uuid = require('uuid')
const is = require('../src/is')
const enums = require('../src/enums')

isTests()
function isTests () {
  test('is', (t) => {
    t.plan(71)

    const ms = 5000
    const tDate = new Date()
    const earlyDate = new Date(tDate.getTime() - ms)
    const laterDate = new Date(tDate.getTime() + ms)
    const job = {
      id: uuid.v4(),
      queueId: 'queue id string',
      dateCreated: new Date(),
      priority: enums.priority.normal,
      status: enums.status.created,
      repeat: false,
      processCount: 0
    }
    const log = {
      date: new Date(),
      queueId: 'queue id string',
      type: 'type string',
      status: 'status string'
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
    t.ok(is.error(new Error()), 'Is error true with new Error')
    t.ok(is.error(Error()), 'Is error true with Error')
    t.notOk(is.error('not an error'), 'Is error false with string')
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
    job.dateCreated = new Date()
    job.priority = 40
    t.ok(is.job(job), 'Is job true with priority a number')
    job.priority = enums.priority.normal
    job.status = 'not a real status'
    t.notOk(is.job(job), 'Is job false with invalid status')
    job.repeat = true
    t.ok(is.repeating(job), 'Is job repeating true when repeat is true')
    job.repeat = 5
    t.ok(is.repeating(job), 'Is job repeating true when repeat is integer')
    job.processCount = 5
    t.ok(is.repeating(job), 'Is job repeating true when processCount equals repeat')
    job.processCount = 6
    t.notOk(is.repeating(job), 'Is job repeating false when processCount > repeat')
    job.repeat = 0
    t.notOk(is.repeating(job), 'Is job repeating false when repeat is 0')
    job.repeat = false
    t.notOk(is.repeating(job), 'Is job repeating false when repeat is false')
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
    t.notOk(is.dateBefore(tDate, earlyDate), 'Is dateBefore false when after')
    t.ok(is.dateBefore(tDate, laterDate), 'Is dateBefore true when before')
    t.notOk(is.dateAfter(tDate, laterDate), 'Is dateAfter false when before')
    t.ok(is.dateAfter(tDate, earlyDate), 'Is dateAfter true when after')
    t.notOk(is.dateBetween(earlyDate, tDate, laterDate), 'Is dateBetween false when before dates')
    t.notOk(is.dateBetween(laterDate, earlyDate, tDate), 'Is dateBetween false when after dates')
    t.ok(is.dateBetween(tDate, earlyDate, laterDate), 'Is dateBetween true when between dates')
    t.ok(is.log(log), 'Is log true with mock log')
    log.date = 'not a date'
    t.notOk(is.log(log), 'Is log false with invalid date')
    log.date = new Date()
    delete log.queueId
    t.notOk(is.log(log), 'Is log false with no queueId')
    log.queueId = 'queue id string'
    delete log.type
    t.notOk(is.log(log), 'Is log false with no type')
    log.type = 'type string'
    delete log.status
    t.notOk(is.log(log), 'Is log false with no status`')
  })
}
