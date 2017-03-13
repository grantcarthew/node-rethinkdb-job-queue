const test = require('tap').test
const Promise = require('bluebird')
const errorBooster = require('../src/error-booster')
const EventEmitter = require('events')
const is = require('../src/is')

errorBoosterTests()
function errorBoosterTests () {
  return new Promise((resolve, reject) => {
    test('error-booster', (t) => {
      t.plan(7)

      const testName = 'function name'
      const mockQueue = new EventEmitter()
      mockQueue.id = 'mock queue id'
      const mockErrorMessage = 'mock error message'
      const mockError = new Error(mockErrorMessage)

      function mockLogger (message, queueId, errObj) {
        t.ok(message.includes(testName), 'Logger message contains name')
        t.ok(is.string(queueId), 'queueId is a string')
        t.ok(is.error(errObj), 'error object is valid')
      }

      function mockHandler (errObj) {
        t.pass('Error event emitted')
        t.ok(is.error(errObj), 'Error event object is valid')
        t.equal(errObj.queueId, mockQueue.id, 'Error object has queueId property')
      }

      const errorBoosterInternal = errorBooster(mockQueue, mockLogger, testName)
      mockQueue.on('error', mockHandler)
      return errorBoosterInternal(mockError).then(() => {
        t.fail('This should never be reached!')
      }).catch(err => {
        t.ok(err === mockError, 'Error object is passed to the catch')
      }).then(() => {
        return resolve(t.end())
      })
    })
  })
}
