const test = require('tap').test
const tError = require('./test-error')
const enums = require('../src/enums')
const jobOptions = require('../src/job-options')

jobOptionsTests()
function jobOptionsTests () {
  test('job-options', (t) => {
    t.plan(70)

    try {
      let to = jobOptions()
      t.equal(to.name, null, 'Job default name option is null')
      t.equal(to.priority, 'normal', 'Job default priority option is normal')
      t.equal(to.timeout, enums.options.timeout, 'Job default timeout option is valid')
      t.equal(to.retryMax, enums.options.retryMax, 'Job default retryMax option is valid')
      t.equal(to.retryDelay, enums.options.retryDelay, 'Job default retryDelay option is valid')
      t.equal(to.repeat, enums.options.repeat, 'Job default repeat option is valid')
      t.equal(to.repeatDelay, enums.options.repeatDelay, 'Job default repeatDelay option is valid')
      to = jobOptions({
        name: 'one',
        priority: 'high',
        timeout: 100000,
        retryMax: 8,
        retryDelay: 200000,
        repeat: 4,
        repeatDelay: 1000
      }, to)
      t.equal(to.name, 'one', 'Job custom name option is valid')
      t.equal(to.priority, 'high', 'Job custom priority option is valid')
      t.equal(to.timeout, 100000, 'Job custom timeout option is valid')
      t.equal(to.retryMax, 8, 'Job custom retryMax option is valid')
      t.equal(to.retryDelay, 200000, 'Job custom retryDelay option is valid')
      t.equal(to.repeat, 4, 'Job custom repeat option is valid')
      t.equal(to.repeatDelay, 1000, 'Job custom repeatDelay option is valid')

      to = jobOptions({ name: 'two' }, to)
      t.equal(to.name, 'two', 'Job name custom name option is valid')
      t.equal(to.priority, 'high', 'Job priority custom priority option is valid')
      t.equal(to.timeout, 100000, 'Job priority custom timeout option is valid')
      t.equal(to.retryMax, 8, 'Job priority custom retryMax option is valid')
      t.equal(to.retryDelay, 200000, 'Job priority custom retryDelay option is valid')
      t.equal(to.repeat, 4, 'Job priority custom repeat option is valid')
      t.equal(to.repeatDelay, 1000, 'Job priority custom repeatDelay option is valid')

      to = jobOptions({ priority: 'lowest' }, to)
      t.equal(to.name, 'two', 'Job name custom name option is valid')
      t.equal(to.priority, 'lowest', 'Job priority custom priority option is valid')
      t.equal(to.timeout, 100000, 'Job priority custom timeout option is valid')
      t.equal(to.retryMax, 8, 'Job priority custom retryMax option is valid')
      t.equal(to.retryDelay, 200000, 'Job priority custom retryDelay option is valid')
      t.equal(to.repeat, 4, 'Job priority custom repeat option is valid')
      t.equal(to.repeatDelay, 1000, 'Job priority custom repeatDelay option is valid')

      to = jobOptions({ timeout: 700000 }, to)
      t.equal(to.name, 'two', 'Job name custom name option is valid')
      t.equal(to.priority, 'lowest', 'Job timeout custom priority option is valid')
      t.equal(to.timeout, 700000, 'Job timeout custom timeout option is valid')
      t.equal(to.retryMax, 8, 'Job timeout custom retryMax option is valid')
      t.equal(to.retryDelay, 200000, 'Job timeout custom retryDelay option is valid')
      t.equal(to.repeat, 4, 'Job timeout custom repeat option is valid')
      t.equal(to.repeatDelay, 1000, 'Job timeout custom repeatDelay option is valid')

      to = jobOptions({ retryMax: 2 }, to)
      t.equal(to.name, 'two', 'Job name custom name option is valid')
      t.equal(to.priority, 'lowest', 'Job retryMax custom priority option is valid')
      t.equal(to.timeout, 700000, 'Job retryMax custom timeout option is valid')
      t.equal(to.retryMax, 2, 'Job retryMax custom retryMax option is valid')
      t.equal(to.retryDelay, 200000, 'Job retryMax custom retryDelay option is valid')
      t.equal(to.repeat, 4, 'Job retryMax custom repeat option is valid')
      t.equal(to.repeatDelay, 1000, 'Job retryMax custom repeatDelay option is valid')

      to = jobOptions({ retryDelay: 800000 }, to)
      t.equal(to.name, 'two', 'Job name custom name option is valid')
      t.equal(to.priority, 'lowest', 'Job retryDelay custom priority option is valid')
      t.equal(to.timeout, 700000, 'Job retryDelay custom timeout option is valid')
      t.equal(to.retryMax, 2, 'Job retryDelay custom retryMax option is valid')
      t.equal(to.retryDelay, 800000, 'Job retryDelay custom retryDelay option is valid')
      t.equal(to.repeat, 4, 'Job retryDelay custom repeat option is valid')
      t.equal(to.repeatDelay, 1000, 'Job retryDelay custom repeatDelay option is valid')

      to = jobOptions({ repeat: false }, to)
      t.equal(to.name, 'two', 'Job name custom name option is valid')
      t.equal(to.priority, 'lowest', 'Job repeat custom priority option is valid')
      t.equal(to.timeout, 700000, 'Job repeat custom timeout option is valid')
      t.equal(to.retryMax, 2, 'Job repeat custom retryMax option is valid')
      t.equal(to.retryDelay, 800000, 'Job repeat custom retryDelay option is valid')
      t.equal(to.repeat, false, 'Job repeat custom repeat option is valid')
      t.equal(to.repeatDelay, 1000, 'Job repeat custom repeatDelay option is valid')

      to = jobOptions({ repeatDelay: 2000 }, to)
      t.equal(to.name, 'two', 'Job name custom name option is valid')
      t.equal(to.priority, 'lowest', 'Job repeatDelay custom priority option is valid')
      t.equal(to.timeout, 700000, 'Job repeatDelay custom timeout option is valid')
      t.equal(to.retryMax, 2, 'Job repeatDelay custom retryMax option is valid')
      t.equal(to.retryDelay, 800000, 'Job repeatDelay custom retryDelay option is valid')
      t.equal(to.repeat, false, 'Job repeatDelay custom repeat option is valid')
      t.equal(to.repeatDelay, 2000, 'Job repeatDelay custom repeatDelay option is valid')

      to = jobOptions({
        name: true,
        priority: 'oops',
        timeout: -20,
        retryMax: -30,
        retryDelay: -40,
        repeat: -50,
        repeatDelay: -60
      }, to)
      t.equal(to.name, 'two', 'Job invalid name option is reverted')
      t.equal(to.priority, 'lowest', 'Job invalid priority option is reverted')
      t.equal(to.timeout, 700000, 'Job invalid timeout option is reverted')
      t.equal(to.retryMax, 2, 'Job invalid retryMax option is reverted')
      t.equal(to.retryDelay, 800000, 'Job invalid retryDelay option is reverted')
      t.equal(to.repeat, false, 'Job invalid repeat option is reverted')
      t.equal(to.repeatDelay, 2000, 'Job invalid repeatDelay option is reverted')
    } catch (err) {
      tError(err, module, t)
    }
  })
}
