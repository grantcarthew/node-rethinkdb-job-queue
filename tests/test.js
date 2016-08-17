const Queue = require('../src/queue')
const q = new Queue()

let job = q.createJob().setPayload('job data goes here')

// console.log(job)
// console.dir(job)

q.addJob(job).then((jobs) => {
  return q.getJob(job.id)
}).then((savedJobs) => {
  console.dir(savedJobs[0].getCleanCopy(true))

  return q.stop()
})
