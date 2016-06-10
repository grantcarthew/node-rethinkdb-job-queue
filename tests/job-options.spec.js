const test = require('tape')
const testError = require('./test-error')
const jobOptions = require('../src/job-options')

module.exports = function () {
  test('job-options test', (t) => {
    t.plan(8)

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
      })
      t.equal(to.priority, 'high', 'Job custom priority option is correct')
      t.equal(to.timeout, 100, 'Job custom timeout option is correct')
      t.equal(to.retryMax, 8, 'Job custom retryMax option is correct')
      t.equal(to.retryDelay, 200, 'Job custom retryDelay option is correct')
    } catch (err) {
      testError(err, module, t)
    }
  })
}
