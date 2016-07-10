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
    ready: 'ready', // Queue status
    paused: 'paused', // Queue status
    resumed: 'resumed', // Queue status
    idle: 'idle', // Queue status
    reset: 'reset', // Queue status
    error: 'error', // Queue status
    review: 'review', // Queue status
    detached: 'detached', // Queue status
    stopping: 'stopping', // Queue status
    stopped: 'stopped', // Queue status
    dropped: 'dropped', // Queue status
    created: 'created', // Job status (non-event)
    added: 'added', // Job status
    waiting: 'waiting', // Job status (non-event)
    active: 'active', // Job status
    processing: 'processing', // Job status
    progress: 'progress', // Job status
    completed: 'completed', // Job status
    cancelled: 'cancelled', // Job status
    timeout: 'timeout', // Job status (non-event)
    failed: 'failed', // Job status
    terminated: 'terminated', // Job status
    removed: 'removed' // Job status
  },
  index: {
    indexActiveDateRetry: 'indexActiveDateRetry', // Used by db-review
    indexInactivePriorityDateCreated: 'indexInactivePriorityDateCreated'
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
