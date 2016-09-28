const logger = require('./logger')(module)
const Promise = require('bluebird')
const enums = require('./enums')
const is = require('./is')
const queueProcess = require('./queue-process')
const queueState = require('./queue-state')

module.exports.pause = function interruptionPause (q, source) {
  logger(`pause`, source)
  q._paused = true
  const makeGlobal = is.true(source)
  const eventGlobal = makeGlobal || source === enums.state.global
  return q.ready().then(() => {
    if (makeGlobal) {
      return queueState(q, enums.status.paused)
    }
    return
  }).then(() => {
    return new Promise((resolve, reject) => {
      logger(`Event: pausing [${q.id}]`)
      q.emit(enums.status.pausing, q.id)
      if (q.running < 1) { return resolve() }
      let intId = setInterval(function pausing () {
        logger(`Pausing, waiting on running jobs: [${q.running}]`)
        if (q.running < 1) {
          clearInterval(intId)
          resolve()
        }
      }, 400)
    })
  }).then(() => {
    logger(`Event: paused [global:${eventGlobal}] [${q.id}]`)
    q.emit(enums.status.paused, eventGlobal, q.id)
    return true
  })
}

module.exports.resume = function interruptionResume (q, source) {
  logger(`resume`, source)
  q._paused = false
  const makeGlobal = is.true(source)
  const eventGlobal = makeGlobal || source === enums.state.global
  return q.ready().then(() => {
    if (makeGlobal) {
      return queueState(q, enums.status.active)
    }
    return
  }).then(() => {
    queueProcess.restart(q)
    logger(`Event: resumed [global:${eventGlobal}] [${q.id}]`)
    q.emit(enums.status.resumed, eventGlobal, q.id)
    return true
  })
}
