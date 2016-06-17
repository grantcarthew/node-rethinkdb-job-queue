const q = require('./test-queue')()
return q.getStatusSummary().then((summary) => {
  console.dir(summary)
  return q.stop(100)
})
