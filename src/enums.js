module.exports = {
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
    retry: 'retry'
  },
  jobEvent: {
    created: 'created',
    delayed: 'delayed',
    active: 'active',
    waiting: 'waiting',
    completed: 'completed',
    failed: 'failed',
    retry: 'retry'
  },
  queueStatus: {
    ready: 'ready',
    enqueue: 'enqueue',
    idle: 'idle',
    processing: 'processing',
    error: 'error'
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
    timeout: 'Job processing has timed out'
  },
  error: {
    notCommited: 'Job not added to the queue',
    nonWorker: 'Cannot call queue process on a non-worker',
    processTwice: 'Cannot call queue process twice'
  }
}
