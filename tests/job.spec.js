const test = require('tape')
const Promise = require('bluebird')
const testQueue = require('./test-queue')
const Job = require('../src/job')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('job test', (t) => {
      t.plan(1)

      const q = testQueue()
      const newJob = new Job(q, testData)

      t.ok(newJob instanceof Job, 'New job is a Job object')

      // return YYYYYY().then((ZZZZZZZ) => {
      //   t.deepEqual(, , 'Blah successfully')
      // }).catch((err) => {
      //   t.deepEqual(, , 'Blah failing')
        resolve()
      // }).catch(err => t.fail(err))
    })
  })
}
