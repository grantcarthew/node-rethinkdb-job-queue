const Queue = require('../src/queue')
const q = new Queue()

let job = q.createJob()

// console.log(job)
// console.dir(job)

q.addJob(job).then((jobs) => {
  return q.summary()
}).then((result) => {
  console.dir(result)

  return q.stop()
})
