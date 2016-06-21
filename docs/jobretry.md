# Job Retry

When creating jobs you have an option of setting the `retryMax` and `retryDelay` values. Both of these values will determine what will happen if a job fails either by a worker node not responding or the job process failing.

Every job has a property called `dateRetry` which is used to determine if the job is ready for processing after a failure has occurred. The `dateRetry` value is set when the job is retrieved from the database for processing. The retrieval query will not return jobs where the `dateRetry` value is greater than the current date time value.

Currently the formula used to set the `dateRetry` value during the job retrieval process is:

```js
now() + job.timeout + ( job.retryDelay * job.retryCount )
```

The plan in the future is to move this to an exponential formula once `RethinDB` has a `power` function.

As you can see, to disable the retry process and make jobs retry as soon as possible, simply set the `retryDelay` to zero.

If we take the default values for the `retryMax` which is 3, and `retryDelay` which is 600 seconds (10 minutes), then the following sequence of events will occur:

1.  Job has never been processed.

    -   `retryCount = 0`

-   Job has defaults properties.

    -   `timeout = 300`
    -   `retryCount = 0`
    -   `retryMax = 3`
    -   `retryDelay = 600`

-   Job is retrieved from database setting the `dateRetry` value.

    -   `dateRetry = now() + timeout`

-   Job fails for some reason.

    -   `retryCount = 1`

-   Job is available to be retrieved from the database after __300__ seconds.

-   Job is retrieved from database setting the `dateRetry` value.

    -   `dateRetry = now + timeout + (retryDelay * retryCount)`

-   Job fails for some reason.

    -   `retryCount = 2`

-   Job is available to be retrieved from the database after __900__ seconds.

-   Job is retrieved from database setting the `dateRetry` value.

    -   `dateRetry = now + timeout + (retryDelay * retryCount)`

-   Job fails for some reason.

    -   `retryCount = 3`

-   Job is available to be retrieved from the database after __1500__ seconds.

-   Job is retrieved from database setting the `dateRetry` value.

    -   This is redundant because the job has hard failed, however it is easier to set the value than add branching logic for this one case.

-   Job has hard failed and will no longer be retrieved from the database.
