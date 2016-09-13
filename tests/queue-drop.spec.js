const test = require('tape')
const Promise = require('bluebird')
const is = require('../src/is')
const enums = require('../src/enums')
const tError = require('./test-error')
const queueDrop = require('../src/queue-drop')
const Queue = require('../src/queue')
const tOpts = require('./test-options')
const rethinkdbdash = require('rethinkdbdash')

module.exports = function () {
  const mockQueue = {
    r: rethinkdbdash(tOpts.cxn()),
    db: tOpts.dbName,
    name: tOpts.queueName,
    id: 'mock:queue:id'
  }

  return new Promise((resolve, reject) => {
    test('queue-drop', (t) => {
      t.plan(10)

      let q = new Queue(tOpts.default(), tOpts.cxn())

      let testEvents = false
      function stoppingEventHandler (qid) {
        if (testEvents) {
          t.pass(`Event: Queue stopping [${qid}]`)
          t.equal(qid, q.id, `Event: Queue stopping id is valid`)
        }
      }
      function stoppedEventHandler (qid) {
        if (testEvents) {
          t.pass(`Event: Queue stopped [${qid}]`)
          t.equal(qid, q.id, `Event: Queue stopped id is valid`)
        }
      }
      function droppedEventHandler (qid) {
        if (testEvents) {
          t.pass(`Event: Queue dropped [${qid}]`)
          t.equal(qid, q.id, `Event: Queue dropped id is valid`)
        }
      }
      function addEventHandlers () {
        testEvents = true
        q.on(enums.status.stopping, stoppingEventHandler)
        q.on(enums.status.stopped, stoppedEventHandler)
        q.on(enums.status.dropped, droppedEventHandler)
      }
      function removeEventHandlers () {
        testEvents = false
        q.removeListener(enums.status.stopping, stoppingEventHandler)
        q.removeListener(enums.status.stopped, stoppedEventHandler)
        q.removeListener(enums.status.dropped, droppedEventHandler)
      }

      function simulateJobProcessing () {
        q._running = 1
        setTimeout(function setRunningToZero () {
          q._running = 0
        }, 500)
      }

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')

        // ---------- Drop Queue Test ----------
        t.comment('queue-drop: Drop Queue')
        addEventHandlers()
        simulateJobProcessing()
        return queueDrop(q)
      }).then((removeResult) => {
        t.ok(removeResult, 'Queue dropped')
        return q.ready()
      }).then((ready) => {
        t.notOk(ready, 'Queue ready returns false')
        return mockQueue.r.db(mockQueue.db).tableList()
      }).then((tableList) => {
        t.notOk(tableList.includes(mockQueue.name), 'Table dropped from database')

        removeEventHandlers()
        mockQueue.r.getPoolMaster().drain()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
