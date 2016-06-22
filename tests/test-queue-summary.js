const q = require('./test-queue')()
return q.summary().then((summary) => {
  console.dir(summary)
  return q.stop(100)
})
