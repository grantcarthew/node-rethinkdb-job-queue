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

  function readyEventHandler () {
    if (state.enabled) {
      let total = incCount(enums.status.ready)
      t.pass(`Event: ready [${total} of ${state.ready}]`)
    }
  }
  state.handler.set(enums.status.ready, readyEventHandler)

  function processingEventHandler (jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.processing)
      t.ok(is.uuid(jobId),
        `Event: processing [${total} of ${state.processing}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.processing, processingEventHandler)

  function progressEventHandler (jobId, percent) {
    if (state.enabled) {
      let total = incCount(enums.status.progress)
      t.ok(is.uuid(jobId),
        `Event: progress ${percent} [${total} of ${state.progress}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.progress, progressEventHandler)

  function pausingEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.pausing)
      t.pass(`Event: pausing [${total} of ${state.pausing}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.pausing, pausingEventHandler)

  function pausedEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.paused)
      t.pass(`Event: paused [${total} of ${state.paused}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.paused, pausedEventHandler)

  function resumedEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.resumed)
      t.pass(`Event: resumed [${total} of ${state.resumed}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.resumed, resumedEventHandler)

  function removedEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.removed)
      t.pass(`Event: removed [${total} of ${state.removed}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.removed, removedEventHandler)

  function idleEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.idle)
      t.pass(`Event: idle [${total}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.idle, idleEventHandler)

  function resetEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.reset)
      t.pass(`Event: reset [${total} of ${state.reset}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.reset, resetEventHandler)

  function reviewedEventHandler (replaceCount) {
    if (state.enabled) {
      let total = incCount(enums.status.reviewed)
      t.pass(`Event: reviewed [${total} of ${state.reviewed}] [${replaceCount}]`)
    }
  }
  state.handler.set(enums.status.reviewed, reviewedEventHandler)

  function detachedEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.detached)
      t.pass(`Event: detached [${total} of ${state.detached}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.detached, detachedEventHandler)

  function stoppingEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.stopping)
      t.pass(`Event: stopping [${total} of ${state.stopping}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.stopping, stoppingEventHandler)

  function stoppedEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.stopped)
      t.pass(`Event: stopped [${total} of ${state.stopped}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.stopped, stoppedEventHandler)

  function droppedEventHandler (qid) {
    if (state.enabled) {
      let total = incCount(enums.status.dropped)
      t.pass(`Event: dropped [${total} of ${state.dropped}] [${qid}]`)
    }
  }
  state.handler.set(enums.status.dropped, droppedEventHandler)

  function addedEventHandler (jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.added)
      t.pass(`Event: added [${total} of ${state.added}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.added, addedEventHandler)

  function activeEventHandler (jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.active)
      t.pass(`Event: active [${total} of ${state.active}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.active, activeEventHandler)

  function completedEventHandler (jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.completed)
      t.ok(is.uuid(jobId),
        `Event: completed [${total} of ${state.completed}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.completed, completedEventHandler)

  function cancelledEventHandler (jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.cancelled)
      t.ok(is.uuid(jobId),
        `Event: cancelled [${total} of ${state.cancelled}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.cancelled, cancelledEventHandler)

  function failedEventHandler (jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.failed)
      t.ok(is.uuid(jobId),
        `Event: failed [${total} of ${state.failed}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.failed, failedEventHandler)

  function terminatedEventHandler (jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.terminated)
      t.ok(is.uuid(jobId),
        `Event: terminated [${total} of ${state.terminated}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.terminated, terminatedEventHandler)

  function logEventHandler (jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.log)
      t.ok(is.uuid(jobId),
        `Event: log [${total} of ${state.log}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.log, logEventHandler)

  function updatedEventHandler (jobId) {
    if (state.enabled) {
      let total = incCount(enums.status.updated)
      t.ok(is.uuid(jobId),
        `Event: updated [${total} of ${state.updated}] [${jobId}]`)
    }
  }
  state.handler.set(enums.status.updated, updatedEventHandler)

  state.enabled = true
  state.handler.forEach((value, key) => {
    q.on(key, value)
  })
}

module.exports.remove = function eventHandlersRemove (t, q, state) {
  state.enabled = false
  state.handler.forEach((fn, status) => {
    t.equal(state.count.get(status), state[status], `Total ${status} events: [${state[status]}]`)
    q.removeListener(status, fn)
  })
}
