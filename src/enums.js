module.exports = {
  priority: {
    lowest: 60,
    low: 50,
    normal: 40,
    medium: 30,
    high: 20,
    highest: 10,
    retry: 1 // Used for retries after a job has stalled or failed.
  },
  jobStatus: {
    created: 'created',
    delayed: 'delayed',
    active: 'active',
    waiting: 'waiting',
    completed: 'completed',
    failed: 'failed',
    retry: 'retry'
  },
  jobEvents: {
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
    priority_dateCreated: 'priority_dateCreated',
    inactive: 'inactive_priority_dateCreated',
    stalled: 'stalled',
    status: 'status',
    active: 'active'
  },
  log: {
    type: {
      information: 'information',
      warning: 'warning',
      error: 'error'
    }
  },
  messages: {
    completed: 'Job completed successfully',
    failed: 'Job processing failed',
    stalled: 'Job processing has stalled'
  }
}
