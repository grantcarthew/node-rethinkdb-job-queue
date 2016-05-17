module.exports = {
  priorities: {
    lowest: 60, low: 50, normal: 40, medium: 30, high: 20, highest: 10
  },
  statuses: {
    created: 'created',
    delayed: 'delayed',
    active: 'active',
    waiting: 'waiting',
    complete: 'complete',
    failed: 'failed',
    retry: 'retry'
  },
  indexes: {
    priorityAndDateCreated: 'PriorityAndDateCreated',
    status: 'status'
  }
}
