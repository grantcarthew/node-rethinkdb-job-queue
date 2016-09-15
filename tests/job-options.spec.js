const test = require('tape')
const tError = require('./test-error')
const enums = require('../src/enums')
const jobOptions = require('../src/job-options')

module.exports = function () {
  test('job-options', (t) => {
    t.plan(28)

    try {
      let to = jobOptions()
      t.equal(to.priority, 'normal', 'Job default priority option is normal')
      t.equal(to.timeout, enums.options.timeout, 'Job default timeout option is valid')
      t.equal(to.retryMax, enums.options.retryMax, 'Job default retryMax option is 3')
      t.equal(to.retryDelay, enums.options.retryDelay, 'Job default retryDelay option is 600')

      to = jobOptions({
        priority: 'high',
        timeout: 100000,
        retryMax: 8,
        retryDelay: 200000
      }, to)
      t.equal(to.priority, 'high', 'Job custom priority option is correct')
      t.equal(to.timeout, 100000, 'Job custom timeout option is correct')
      t.equal(to.retryMax, 8, 'Job custom retryMax option is correct')
      t.equal(to.retryDelay, 200000, 'Job custom retryDelay option is correct')

      to = jobOptions({ priority: 'lowest' }, to)
      t.equal(to.priority, 'lowest', 'Job priority custom priority option is correct')
      t.equal(to.timeout, 100000, 'Job priority custom timeout option is correct')
      t.equal(to.retryMax, 8, 'Job priority custom retryMax option is correct')
      t.equal(to.retryDelay, 200000, 'Job priority custom retryDelay option is correct')

      to = jobOptions({ timeout: 700000 }, to)
      t.equal(to.priority, 'lowest', 'Job timeout custom priority option is correct')
      t.equal(to.timeout, 700000, 'Job timeout custom timeout option is correct')
      t.equal(to.retryMax, 8, 'Job timeout custom retryMax option is correct')
      t.equal(to.retryDelay, 200000, 'Job timeout custom retryDelay option is correct')

      to = jobOptions({ retryMax: 2 }, to)
      t.equal(to.priority, 'lowest', 'Job retryMax custom priority option is correct')
      t.equal(to.timeout, 700000, 'Job retryMax custom timeout option is correct')
      t.equal(to.retryMax, 2, 'Job retryMax custom retryMax option is correct')
      t.equal(to.retryDelay, 200000, 'Job retryMax custom retryDelay option is correct')

      to = jobOptions({ retryDelay: 800000 }, to)
      t.equal(to.priority, 'lowest', 'Job retryDelay custom priority option is correct')
      t.equal(to.timeout, 700000, 'Job retryDelay custom timeout option is correct')
      t.equal(to.retryMax, 2, 'Job retryDelay custom retryMax option is correct')
      t.equal(to.retryDelay, 800000, 'Job retryDelay custom retryDelay option is correct')

      to = jobOptions({
        priority: 'oops',
        timeout: -20,
        retryMax: -30,
        retryDelay: -40
      }, to)
      t.equal(to.priority, 'lowest', 'Job invalid priority option is correct')
      t.equal(to.timeout, 700000, 'Job invalid timeout option is correct')
      t.equal(to.retryMax, 2, 'Job invalid retryMax option is correct')
      t.equal(to.retryDelay, 800000, 'Job invalid retryDelay option is correct')
    } catch (err) {
      tError(err, module, t)
    }
  })
}
