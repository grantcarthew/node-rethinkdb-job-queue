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
  status: {
    created: 'created',
    delayed: 'delayed',
    active: 'active',
    waiting: 'waiting',
    completed: 'completed',
    failed: 'failed',
    retry: 'retry'
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
