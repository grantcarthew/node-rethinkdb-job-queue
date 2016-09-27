const test = require('tape')
const Promise = require('bluebird')
const enums = require('../src/enums')
const is = require('../src/is')
const tError = require('./test-error')
const tData = require('./test-options').tData
const tOpts = require('./test-options')
const Queue = require('../src/queue')
const queueFindJob = require('../src/queue-find-job')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-find-job', (t) => {
      t.plan(11)

      const q = new Queue(tOpts.cxn(), tOpts.default())
      const titleText = 'Find Job Test'
      let job = q.createJob()
      job.data = tData
      job.title = titleText

      return q.ready().then(() => {
        return q.addJob(job)
      }).then((savedJob1) => {
        t.equal(savedJob1[0].id, job.id, 'Job saved successfully')

        // ---------- Single Job Find Test ----------
        t.comment('queue-find-job: Single Job Find')
        return queueFindJob(q, { title: titleText })
      }).then((foundJobs1) => {
        t.equal(foundJobs1[0].title, titleText, 'Found job successfully')
        t.equal(foundJobs1[0].data, tData, 'Job data is valid')

        // ---------- Multiple Job Find Test ----------
        t.comment('queue-find-job: Multiple Job Find')
        job = q.createJob()
        job.data = tData
        job.title = titleText
        return q.addJob(job)
      }).then((savedJob1) => {
        t.equal(savedJob1[0].id, job.id, 'Job saved successfully')
        return queueFindJob(q, { title: titleText })
      }).then((foundJobs2) => {
        t.equal(foundJobs2.length, 2, 'Found two jobs successfully')
        t.equal(foundJobs2[0].title, titleText, 'Found first job successfully')
        t.equal(foundJobs2[0].data, tData, 'First Job data is valid')
        t.equal(foundJobs2[1].title, titleText, 'Found second job successfully')
        t.equal(foundJobs2[1].data, tData, 'Second Job data is valid')

        // ---------- Predicate Function Job Find Test ----------
        t.comment('queue-find-job: Predicate Function Job Find')
        return queueFindJob(q, (job) => {
          return job('title').eq(titleText)
        })
      }).then((foundJobs4) => {
        t.equal(foundJobs4.length, 2, 'Found two jobs successfully')

        // ---------- Zero Job Find Test ----------
        t.comment('Zero Job Find')
        return queueFindJob(q, { abc: '123' })
      }).then((foundJobs3) => {
        t.equal(foundJobs3.length, 0, 'Zero jobs found successfully')

        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
