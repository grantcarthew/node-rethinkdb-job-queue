const Queue = require('../src/queue')
const q = new Queue()

let job = q.createJob().setPayload('some random data')

q.addJob(job).then((jobs) => {
  return q.getJob(job.id)
}).then((savedJobs) => {
  console.dir(savedJobs)

  return q.stop()
})
