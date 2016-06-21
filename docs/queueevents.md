# Queue Events

Events raised by the Queue object.

## `ready`

__Returns__: null

Raised when the backing database, table, and indexes are ready for use.

## `enqueue`

__Returns__:

## `completed`

__Returns__:

## `retry`

__Returns__:

## `failed`

__Returns__:

## `review enabled`

__Returns__: No objects or values returned

## `review disabled`

__Returns__: No objects or values returned

## `review`

__Returns__: `Number` The number of jobs updated from `active` status to `timeout` or `failed`.

Raised when the database review process completes.

## `reset`

__Returns__: `Number` The total number of jobs deleted from the queue backing table.

## `detached`

__Returns__: `undefined`
