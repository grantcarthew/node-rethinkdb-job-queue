const test = require('tap').test
const Promise = require('bluebird')
const tError = require('./test-error')
const tData = require('./test-options').tData
const tOpts = require('./test-options')
const is = require('../src/is')
const Queue = require('../src/queue')
const queueFindJobByName = require('../src/queue-find-job-by-name')

queueFindJobByNameTests()
function queueFindJobByNameTests () {
  return new Promise((resolve, reject) => {
    test('queue-find-job-by-name', (t) => {
      t.plan(19)

      const q = new Queue(tOpts.cxn(), tOpts.default('queueFindJobByName'))
      const titleText = 'Find Job By Name Test'
      const jobName = 'rjqTestJob'
      let job = q.createJob().setName(jobName)
      job.data = tData
      job.title = titleText

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')
        return q.addJob(job)
      }).then((savedJob1) => {
        t.equal(savedJob1[0].id, job.id, 'Job saved successfully')

        // ---------- Single Job Find Test ----------
        t.comment('queue-find-job-by-name: Single Job Find')
        return queueFindJobByName(q, jobName)
      }).then((foundJobs1) => {
        t.equal(foundJobs1[0].name, jobName, 'Found job by name successfully')
        t.equal(foundJobs1[0].title, titleText, 'Job title is valid')
        t.equal(foundJobs1[0].data, tData, 'Job data is valid')

        // ---------- Single Raw Find Test ----------
        t.comment('queue-find-job-by-name: Raw Job Find')
        return queueFindJobByName(q, jobName, true)
      }).then((foundJobs2) => {
        t.equal(foundJobs2[0].name, jobName, 'Raw found job by name successfully')
        t.equal(foundJobs2[0].title, titleText, 'Raw job title is valid')
        t.equal(foundJobs2[0].data, tData, 'Raw job data is valid')
        t.notOk(foundJobs2[0].q, 'Raw result does not have a q property')

        // ---------- Multiple Job Find Test ----------
        t.comment('queue-find-job-by-name: Multiple Job Find')
        job = q.createJob().setName(jobName)
        job.data = tData
        job.title = titleText
        return q.addJob(job)
      }).then((savedJob2) => {
        t.equal(savedJob2[0].id, job.id, 'Job saved successfully')
        return queueFindJobByName(q, jobName)
      }).then((foundJobs3) => {
        t.equal(foundJobs3.length, 2, 'Found two jobs successfully')
        t.equal(foundJobs3[0].name, jobName, 'Found first job successfully')
        t.equal(foundJobs3[0].title, titleText, 'First job title is valid')
        t.equal(foundJobs3[0].data, tData, 'First job data is valid')
        t.equal(foundJobs3[1].name, jobName, 'Found second job successfully')
        t.equal(foundJobs3[1].title, titleText, 'Second job title is valid')
        t.equal(foundJobs3[1].data, tData, 'Second job data is valid')
        t.ok(is.dateBefore(foundJobs3[0].dateCreated, foundJobs3[1].dateCreated), 'Jobs are in valid order')

        // ---------- Zero Job Find Test ----------
        t.comment('Zero Job Find')
        return queueFindJobByName(q, 'bogus')
      }).then((foundJobs4) => {
        t.equal(foundJobs4.length, 0, 'Zero jobs found successfully')

        q.stop()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
