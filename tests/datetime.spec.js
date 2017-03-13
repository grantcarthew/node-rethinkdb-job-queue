const test = require('tap').test
const is = require('../src/is')
const tError = require('./test-error')
const datetime = require('../src/datetime')

dateTimeTests()
function dateTimeTests () {
  test('datetime', (t) => {
    t.plan(23)

    try {
      const tDate = new Date('2000-01-02 03:04:05.006')
      const tValue = 12345
      const dateStings = {
        date: '2000-01-02',
        time: '03:04:05.006',
        datetime: '2000-01-02 03:04:05.006'
      }
      t.ok(is.date(datetime.add.ms(tDate, tValue)), 'Add ms is a date object')
      t.equal(datetime.add.ms(tDate, tValue) - tDate, tValue, 'Add ms is valid')
      t.ok(is.date(datetime.add.ms(tValue)), 'Add ms only is a date object')
      t.ok(is.dateAfter(datetime.add.ms(tValue)), 'Add ms only is valid')
      t.ok(is.date(datetime.add.sec(tDate, tValue)), 'Add sec is a date object')
      t.equal(datetime.add.sec(tDate, tValue) - tDate, tValue * 1000, 'Add sec is valid')
      t.ok(is.date(datetime.add.sec(tValue)), 'Add sec only is a date object')
      t.ok(is.dateAfter(datetime.add.sec(tValue)), 'Add sec only is valid')
      t.ok(is.date(datetime.add.min(tDate, tValue)), 'Add min is a date object')
      t.equal(datetime.add.min(tDate, tValue) - tDate, tValue * 60000, 'Add min is valid')
      t.ok(is.date(datetime.add.min(tValue)), 'Add min only is a date object')
      t.ok(is.dateAfter(datetime.add.min(tValue)), 'Add min only is valid')
      t.ok(is.date(datetime.add.hours(tDate, tValue)), 'Add hours is a date object')
      t.equal(datetime.add.hours(tDate, tValue) - tDate, tValue * 3600000, 'Add hours is valid')
      t.ok(is.date(datetime.add.hours(tValue)), 'Add hours only is a date object')
      t.ok(is.dateAfter(datetime.add.hours(tValue)), 'Add hours only is valid')
      t.ok(is.date(datetime.add.days(tDate, tValue)), 'Add days is a date object')
      t.equal(datetime.add.days(tDate, tValue) - tDate, tValue * 86400000, 'Add days is valid')
      t.ok(is.date(datetime.add.days(tValue)), 'Add days only is a date object')
      t.ok(is.dateAfter(datetime.add.days(tValue)), 'Add days only is valid')
      t.equal(datetime.formatDate(tDate), dateStings.date, 'formatDate is valid')
      t.equal(datetime.formatTime(tDate), dateStings.time, 'formatTime is valid')
      t.equal(datetime.format(tDate), dateStings.datetime, 'format is valid')
    } catch (err) {
      tError(err, module, t)
    }
  })
}
