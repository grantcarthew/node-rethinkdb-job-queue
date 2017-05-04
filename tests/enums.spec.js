const test = require('tap').test
const tError = require('./test-error')
const enums = require('../src/enums')

enumsTest()
function enumsTest () {
  test('enums', (t) => {
    t.plan(13)

    try {
      t.equal(enums.priorityFromValue(60), 'lowest', 'Priority from value 60 returns lowest')
      t.equal(enums.priorityFromValue(50), 'low', 'Priority from value 50 returns low')
      t.equal(enums.priorityFromValue(40), 'normal', 'Priority from value 40 returns normal')
      t.equal(enums.priorityFromValue(30), 'medium', 'Priority from value 30 returns medium')
      t.equal(enums.priorityFromValue(20), 'high', 'Priority from value 20 returns high')
      t.equal(enums.priorityFromValue(10), 'highest', 'Priority from value 10 returns highest')
      t.equal(Object.keys(enums.state).length, 3, 'Enums state has the correct number of keys')
      t.equal(Object.keys(enums.priority).length, 6, 'Enums priority has correct number of keys')
      t.equal(Object.keys(enums.status).length, 26, 'Enums status has correct number of keys')
      t.equal(Object.keys(enums.options).length, 16, 'Enums options has correct number of keys')
      t.equal(Object.keys(enums.index).length, 5, 'Enums index has correct number of keys')
      t.equal(Object.keys(enums.log).length, 3, 'Enums log has correct number of keys')
      t.equal(Object.keys(enums.message).length, 31, 'Enums message has correct number of keys')
    } catch (err) {
      tError(err, module, t)
    }
  })
}
