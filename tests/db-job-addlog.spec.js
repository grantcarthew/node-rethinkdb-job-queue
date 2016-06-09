const test = require('tape')
const Promise = require('bluebird')
const testQueue = require('./test-queue')
const enums = require('../src/enums')
const dbJobAddLog = require('../src/db-job-addlog')
const testData = require('./test-options').testData

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('db-job-addlog test', (t) => {
      t.plan(1)

      const q = testQueue()
      const job = q.createJob(testData)
      return q.addJob(job).then((newJob) => {
        t.equal(newJob.status, enums.jobStatus.waiting, 'New job added successfully')
        const newLog = newJob.createLog(testDate)
        return dbJobAddLog(newJob, newLog)
      }).then((updateResult) => {
        
      }).catch((err) => {
        t.deepEqual(, , 'Blah failing')
        resolve()
      }).catch(err => t.fail(err))
    })
  })
}
