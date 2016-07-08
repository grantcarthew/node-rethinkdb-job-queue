const enums = module.exports = {
  priorityFromValue: function priorityFromValue (value) {
    return Object.keys(enums.priority).find(key => enums.priority[key] === value)
  },
  priority: {
    lowest: 60,
    low: 50,
    normal: 40,
    medium: 30,
    high: 20,
    highest: 10,
    retry: 1 // Used for retries after a job has timed out or failed.
  },
  status: {
    ready: 'ready',
    created: 'created',
    added: 'added',
    waiting: 'waiting',
    active: 'active',
    processing: 'processing',
    progress: 'progress',
    completed: 'completed',
    cancelled: 'cancelled',
    timeout: 'timeout',
    failed: 'failed',
    idle: 'idle',
    paused: 'paused',
    resumed: 'resumed',
    retry: 'retry',
    error: 'error',
    review: 'review',
    detached: 'detached',
    reset: 'reset',
    stopping: 'stopping',
    stopped: 'stopped',
    removed: 'removed',
    dropped: 'dropped'
  },
  index: {
    status: 'status',
    dateRetry: 'dateRetry',
    priority_dateCreated: 'priority_dateCreated',
    active_dateRetry: 'active_dateRetry',
    inactive_priority_dateCreated: 'inactive_priority_dateCreated'
  },
  dbResult: {
    deleted: 'deleted',
    errors: 'errors',
    inserted: 'inserted',
    replaced: 'replaced',
    skipped: 'skipped',
    changes: 'changes',
    unchanged: 'unchanged'
  },
  log: {
    information: 'information',
    warning: 'warning',
    error: 'error'
  },
  message: {
    active: 'Job retrieved and active',
    completed: 'Job completed successfully',
    failed: 'Job processing failed',
    timeout: 'Job processing has timed out',
    allJobsStopped: 'All running jobs have stopped',
    failedToStop: 'Failed to gracefully stop jobs, force quit',
    cancel: 'Job cancelled by Queue process handler'
  },
  error: {
    jobNotAdded: 'Job not added to the queue',
    jobAlreadyAdded: 'Job is already added to the queue',
    jobInvalid: 'Job object is invalid',
    processTwice: 'Cannot call queue process twice',
    missingTimeout: 'Timeout parameter required to stop or drop queue',
    queueDropped: 'The queue has been dropped',
    idInvalid: 'The job id is invalid',
    reviewOptionInvalid: 'The queue.review option is invalid',
    dbError: 'RethinkDB returned an error',
    isPausedInvalid: 'Queue.paused requires a boolean'
  }
}
