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
  jobStatus: {
    created: 'created',
    delayed: 'delayed',
    active: 'active',
    waiting: 'waiting',
    completed: 'completed',
    timeout: 'timeout',
    failed: 'failed',
    retry: 'retry',
    deleted: 'deleted'
  },
  queueStatus: {
    ready: 'ready',
    enqueue: 'enqueue',
    idle: 'idle',
    processing: 'processing',
    error: 'error',
    review: 'review',
    reviewEnabled: 'review enabled',
    reviewDisabled: 'review disabled',
    detached: 'detached',
    reset: 'reset',
    stopping: 'stopping',
    stopped: 'stopped'
  },
  index: {
    status: 'status',
    priority_dateCreated: 'priority_dateCreated',
    active_dateStarted: 'active_dateStarted',
    inactive_priority_dateCreated: 'inactive_priority_dateCreated'
  },
  log: {
    information: 'information',
    warning: 'warning',
    error: 'error'
  },
  message: {
    completed: 'Job completed successfully',
    failed: 'Job processing failed',
    timeout: 'Job processing has timed out',
    allJobsStopped: 'All running jobs have stopped',
    failedToStop: 'Failed to gracefully stop jobs, force quit'
  },
  error: {
    jobNotAdded: 'Job not added to the queue',
    jobAlreadyAdded: 'Job is already added to the queue',
    jobInvalid: 'Job object is invalid',
    nonWorker: 'Cannot call queue process on a non-worker',
    processTwice: 'Cannot call queue process twice',
    missingTimeout: 'Timeout parameter required to stop or delete queue',
    queueDeleted: 'The queue has been deleted',
    idInvalid: 'The job id is invalid'
  }
}
