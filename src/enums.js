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
    waiting: 'waiting',
    active: 'active',
    completed: 'completed',
    timeout: 'timeout',
    retry: 'retry',
    failed: 'failed',
    deleted: 'deleted'
  },
  queueStatus: {
    ready: 'ready',
    enqueue: 'enqueue',
    processing: 'processing',
    completed: 'completed',
    failed: 'failed',
    idle: 'idle',
    paused: 'paused',
    resumed: 'resumed',
    error: 'error',
    review: 'review',
    reviewEnabled: 'review enabled',
    reviewDisabled: 'review disabled',
    detached: 'detached',
    reset: 'reset',
    stopping: 'stopping',
    stopped: 'stopped',
    deleted: 'deleted'
  },
  reviewRun: {
    enable: 'enable',
    once: 'once',
    disable: 'disable'
  },
  index: {
    status: 'status',
    dateRetry: 'dateRetry',
    priority_dateCreated: 'priority_dateCreated',
    active_dateRetry: 'active_dateRetry',
    inactive_priority_dateCreated: 'inactive_priority_dateCreated'
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
    failedToStop: 'Failed to gracefully stop jobs, force quit'
  },
  error: {
    jobNotAdded: 'Job not added to the queue',
    jobAlreadyAdded: 'Job is already added to the queue',
    jobInvalid: 'Job object is invalid',
    processTwice: 'Cannot call queue process twice',
    missingTimeout: 'Timeout parameter required to stop or delete queue',
    queueDeleted: 'The queue has been deleted',
    idInvalid: 'The job id is invalid',
    reviewOptionInvalid: 'The queue.review option is invalid',
    dbError: 'RethinkDB returned an error',
    isPausedInvalid: 'Queue.paused requires a boolean'
  }
}
