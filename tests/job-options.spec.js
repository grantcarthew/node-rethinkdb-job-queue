const test = require('tape')
const testError = require('./test-error')
const jobOptions = require('../src/job-options')

module.exports = function () {
  test('job-options', (t) => {
    t.plan(28)

    try {
      let to = jobOptions()
      t.equal(to.priority, 'normal', 'Job default priority option is normal')
      t.equal(to.timeout, 300, 'Job default timeout option is 300')
      t.equal(to.retryMax, 3, 'Job default retryMax option is 3')
      t.equal(to.retryDelay, 600, 'Job default retryDelay option is 600')

      to = jobOptions({
        priority: 'high',
        timeout: 100,
        retryMax: 8,
        retryDelay: 200
      }, to)
      t.equal(to.priority, 'high', 'Job custom priority option is correct')
      t.equal(to.timeout, 100, 'Job custom timeout option is correct')
      t.equal(to.retryMax, 8, 'Job custom retryMax option is correct')
      t.equal(to.retryDelay, 200, 'Job custom retryDelay option is correct')

      to = jobOptions({ priority: 'lowest' }, to)
      t.equal(to.priority, 'lowest', 'Job priority custom priority option is correct')
      t.equal(to.timeout, 100, 'Job priority custom timeout option is correct')
      t.equal(to.retryMax, 8, 'Job priority custom retryMax option is correct')
      t.equal(to.retryDelay, 200, 'Job priority custom retryDelay option is correct')

      to = jobOptions({ timeout: 700 }, to)
      t.equal(to.priority, 'lowest', 'Job timeout custom priority option is correct')
      t.equal(to.timeout, 700, 'Job timeout custom timeout option is correct')
      t.equal(to.retryMax, 8, 'Job timeout custom retryMax option is correct')
      t.equal(to.retryDelay, 200, 'Job timeout custom retryDelay option is correct')

      to = jobOptions({ retryMax: 2 }, to)
      t.equal(to.priority, 'lowest', 'Job retryMax custom priority option is correct')
      t.equal(to.timeout, 700, 'Job retryMax custom timeout option is correct')
      t.equal(to.retryMax, 2, 'Job retryMax custom retryMax option is correct')
      t.equal(to.retryDelay, 200, 'Job retryMax custom retryDelay option is correct')

      to = jobOptions({ retryDelay: 800 }, to)
      t.equal(to.priority, 'lowest', 'Job retryDelay custom priority option is correct')
      t.equal(to.timeout, 700, 'Job retryDelay custom timeout option is correct')
      t.equal(to.retryMax, 2, 'Job retryDelay custom retryMax option is correct')
      t.equal(to.retryDelay, 800, 'Job retryDelay custom retryDelay option is correct')

      to = jobOptions({
        priority: 'oops',
        timeout: -20,
        retryMax: -30,
        retryDelay: -40
      }, to)
      t.equal(to.priority, 'lowest', 'Job invalid priority option is correct')
      t.equal(to.timeout, 700, 'Job invalid timeout option is correct')
      t.equal(to.retryMax, 2, 'Job invalid retryMax option is correct')
      t.equal(to.retryDelay, 800, 'Job invalid retryDelay option is correct')
    } catch (err) {
      testError(err, module, t)
    }
  })
}
