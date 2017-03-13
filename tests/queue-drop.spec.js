const test = require('tap').test
const Promise = require('bluebird')
const is = require('../src/is')
const tError = require('./test-error')
const queueDrop = require('../src/queue-drop')
const Queue = require('../src/queue')
const simulateJobProcessing = require('./test-utils').simulateJobProcessing
const tOpts = require('./test-options')
const rethinkdbdash = require('rethinkdbdash')
const eventHandlers = require('./test-event-handlers')
const testName = 'queue-drop'

queueDropTests()
function queueDropTests () {
  return new Promise((resolve, reject) => {
    test(testName, (t) => {
      t.plan(33)

      const tableName = 'queueDrop'
      const mockQueue = {
        r: rethinkdbdash(Object.assign(tOpts.cxn(), { silent: true })),
        db: tOpts.dbName,
        name: tableName,
        id: 'mock:queue:id'
      }

      let q = new Queue(tOpts.cxn(), tOpts.default(tableName))

      // ---------- Event Handler Setup ----------
      let state = {
        testName,
        enabled: false,
        ready: 0,
        processing: 0,
        progress: 0,
        pausing: 1,
        paused: 1,
        resumed: 0,
        removed: 0,
        reset: 0,
        error: 0,
        reviewed: 0,
        detached: 1,
        stopping: 1,
        stopped: 1,
        dropped: 1,
        added: 0,
        waiting: 0,
        active: 0,
        completed: 0,
        cancelled: 0,
        failed: 0,
        terminated: 0,
        reanimated: 0,
        log: 0,
        updated: 0
      }

      return q.reset().then((resetResult) => {
        t.ok(is.integer(resetResult), 'Queue reset')

        // ---------- Drop Queue Test ----------
        t.comment('queue-drop: Drop Queue')
        eventHandlers.add(t, q, state)
        simulateJobProcessing(q)
        return queueDrop(q)
      }).then((removeResult) => {
        t.ok(removeResult, 'Queue dropped')
        return q.ready()
      }).then((ready) => {
        t.notOk(ready, 'Queue ready returns false')
        return mockQueue.r.db(mockQueue.db).tableList()
      }).then((tableList) => {
        t.notOk(tableList.includes(mockQueue.name), 'Table dropped from database')

        // ---------- Event Summary ----------
        eventHandlers.remove(t, q, state)
        mockQueue.r.getPoolMaster().drain()
        return resolve(t.end())
      }).catch(err => tError(err, module, t))
    })
  })
}
