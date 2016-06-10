const Queue = require('../src/queue')
const testQ = new Queue({
  queueName: 'JobQueueUnitTests'
})
testQ.getStatusSummary().then((summary) => {
  console.dir(summary)
  testQ.close()
})
