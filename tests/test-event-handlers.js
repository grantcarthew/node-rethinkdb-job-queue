const is = require('../src/is')
const enums = require('../src/enums')

module.exports.add = function eventHandlersAdd (t, q, state) {
  state.count = new Map()
  state.handler = new Map()
  for (let key of Object.keys(enums.status)) {
    state.count.set(key, 0)
  }
  function incCount (status) {
    let current = state.count.get(status)
    current++
    return state.count.set(status, current).get(status)
  }

  function readyEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.ready)
      t.ok(is.string(qid), `Event: ready [${total} of ${state.ready}]`)
    }
  }
  state.handler.set(enums.status.ready, readyEventHandler)

  function processingEventHandler (qid, jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.processing)
      t.ok(is.string(qid) && is.uuid(jobId),
        `Event: processing [${total} of ${state.processing}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.processing, processingEventHandler)

  function progressEventHandler (qid, jobId, percent) {
    if (state.enabled) {
      let total = incCount(enums.status.progress)
      let percentTest = is.integer(percent) && percent >= 0 && percent <= 100
      t.ok(is.string(qid) && is.uuid(jobId) && percentTest,
        `Event: progress ${percent} [${total} of ${state.progress}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.progress, progressEventHandler)

  function pausingEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.pausing)
      t.ok(is.string(qid), `Event: pausing [${total} of ${state.pausing}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.pausing, pausingEventHandler)

  function pausedEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.paused)
      t.ok(is.string(qid), `Event: paused [${total} of ${state.paused}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.paused, pausedEventHandler)

  function resumedEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.resumed)
      t.ok(is.string(qid), `Event: resumed [${total} of ${state.resumed}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.resumed, resumedEventHandler)

  function removedEventHandler (qid, jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.removed)
      t.ok(is.string(qid) && is.uuid(jobId), `Event: removed [${total} of ${state.removed}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.removed, removedEventHandler)

  function resetEventHandler (qid, totalRemoved) {
    if (state.enabled) {
      let total = incCount(enums.status.reset)
      t.ok(is.string(qid) && is.integer(totalRemoved) && totalRemoved >= 0,
        `Event: reset [${total} of ${state.reset}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.reset, resetEventHandler)

  function reviewedEventHandler (qid, reviewResult) {
    if (state.enabled) {
      let total = incCount(enums.status.reviewed)
      let result
      if (is.object(reviewResult) && reviewResult.local) {
        result = is.integer(reviewResult.reviewed) &&
          is.integer(reviewResult.removed) &&
          reviewResult.reviewed >= 0 &&
          reviewResult.removed >= 0
      } else {
        // global events will contain null in reviewed and removed.
        result = is.object(reviewResult) && !reviewResult.local
      }
      t.ok(result,
        `Event: reviewed [${total} of ${state.reviewed}] [${reviewResult}]`)
    }
  }
  state.handler.set(enums.status.reviewed, reviewedEventHandler)

  function detachedEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.detached)
      t.ok(is.string(qid),
        `Event: detached [${total} of ${state.detached}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.detached, detachedEventHandler)

  function stoppingEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.stopping)
      t.ok(is.string(qid),
        `Event: stopping [${total} of ${state.stopping}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.stopping, stoppingEventHandler)

  function stoppedEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.stopped)
      t.ok(is.string(qid),
        `Event: stopped [${total} of ${state.stopped}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.stopped, stoppedEventHandler)

  function droppedEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.dropped)
      t.ok(is.string(qid),
        `Event: dropped [${total} of ${state.dropped}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.dropped, droppedEventHandler)

  function addedEventHandler (qid, jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.added)
      t.ok(is.string(qid) && is.uuid(jobId),
        `Event: added [${total} of ${state.added}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.added, addedEventHandler)

  function activeEventHandler (qid, jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.active)
      t.ok(is.string(qid) && is.uuid(jobId),
        `Event: active [${total} of ${state.active}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.active, activeEventHandler)

  function completedEventHandler (qid, jobId, isRepeating) {
    if (state.enabled) {
      let total = incCount(enums.status.completed)
      t.ok(is.string(qid) && is.uuid(jobId) && is.boolean(isRepeating),
        `Event: completed [${total} of ${state.completed}] [${jobId}] isRepeating: [${isRepeating}]`)
    }
  }
  state.handler.set(enums.status.completed, completedEventHandler)

  function cancelledEventHandler (qid, jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.cancelled)
      t.ok(is.string(qid) && is.uuid(jobId),
        `Event: cancelled [${total} of ${state.cancelled}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.cancelled, cancelledEventHandler)

  function failedEventHandler (qid, jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.failed)
      t.ok(is.string(qid) && is.uuid(jobId),
        `Event: failed [${total} of ${state.failed}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.failed, failedEventHandler)

  function terminatedEventHandler (qid, jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.terminated)
      t.ok(is.string(qid) && is.uuid(jobId),
        `Event: terminated [${total} of ${state.terminated}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.terminated, terminatedEventHandler)

  function reanimatedEventHandler (qid, jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.reanimated)
      t.ok(is.string(qid) && is.uuid(jobId),
        `Event: reanimated [${total} of ${state.reanimated}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.reanimated, reanimatedEventHandler)

  function logEventHandler (qid, jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.log)
      t.ok(is.string(qid) && is.uuid(jobId),
        `Event: log [${total} of ${state.log}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.log, logEventHandler)

  function updatedEventHandler (qid, jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.updated)
      t.ok(is.string(qid) && is.uuid(jobId),
        `Event: updated [${total} of ${state.updated}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.updated, updatedEventHandler)

  function errorEventHandler (err) {
    if (state.enabled) {
      let total = incCount(enums.status.error)
      t.ok(is.string(err.queueId) && is.error(err),
        `Event: error [${total} of ${state.error}] Error: [${err.message}]`)
    }
  }
  state.handler.set(enums.status.error, errorEventHandler)

  state.enabled = true
  state.handler.forEach((value, key) => {
    q.on(key, value)
  })
  t.comment(state.testName + ': Event Handlers Added')
}

module.exports.remove = function eventHandlersRemove (t, q, state) {
  state.enabled = false
  t.comment(state.testName + ': Event Summary')

  state.handler.forEach((fn, status) => {
    t.equal(state.count.get(status), state[status], `Total ${status} events: [${state[status]}]`)
    q.removeListener(status, fn)
  })
  t.comment(state.testName + ': Event Handlers Removed')
}
