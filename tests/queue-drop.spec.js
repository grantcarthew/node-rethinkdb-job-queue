const test = require('tape')
const Promise = require('bluebird')
const moment = require('moment')
const is = require('../src/is')
const enums = require('../src/enums')
const testError = require('./test-error')
const testMockQueue = require('./test-mock-queue')
const testQueue = require('./test-queue')
const testOptionsDefault = require('./test-options').queueDefault()
const queueDrop = require('../src/queue-drop')

module.exports = function () {
  return new Promise((resolve, reject) => {
    test('queue-drop', (t) => {
      t.plan(11)

      const mockQueue = testMockQueue()
      let q = testQueue()

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
        q = testQueue(testOptionsDefault)
        return q.ready()
      }).then((ready) => {
        t.ok(ready, 'Queue in a ready state')
        return resolve()
      }).catch(err => testError(err, module, t))
    })
  })
}
