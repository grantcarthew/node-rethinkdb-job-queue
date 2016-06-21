# Master Queue

During normal queue operation, worker nodes processing jobs will detect when a job has taken too long and is operating past its `timeout` value.

However, if a queue worker node fails for any reason whilst working on a job, the job will not complete and will remain in the database with an `active` status causing an orphaned job.

To ensure the job is not forgotten, `rethinkdb-job-queue` has an option called `isMaster` you can pass when creating a queue. The `isMaster` option defaults to `true` if not supplied. There should be at least one master node per queue. _It is worth noting that only one master can be enabled per process. If the node process already has a queue that is a master, then creating more master queues will not start more masters._

When a queue node is a master, it will review the queue backing table based on the `masterReviewPeriod` option which defaults to `300` seconds or 5 minutes.

When the master node reviews the queue backing table, it looks for jobs that are `active` and past their review timeout value which is different to the job `timeout` value.

The review timeout value is calculated from the following formula;

```js
 job.dateStarted + job.timeout + 60
 ```

The extra `60` seconds is to allow a functioning queue worker node to detect when a job has timed out and update it prior to the master review.

If a job is `active` and the current time is past the review timeout, the job is updated to a `retry` status and the priority is set to `retry` (a stored value of 1) which is the highest priority. The jobs `retryCount` value does not get incremented because the worker node failed.

It is worth noting that the database review process is called when the `queue.process()` function is first called. This means that if you don't have a master queue, orphaned jobs will still be updated on process restart.
