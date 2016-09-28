const logger = require('./logger')(module)
const enums = require('./enums')

module.exports = function queueState (q, newState) {
  logger('queueState', newState)
  return q.ready().then(() => {
    return q.r.db(q.db).table(q.name)
      .insert({
        id: enums.state.docId,
        queueId: q.id,
        dateChange: q.r.now(),
        state: newState
      }, { conflict: 'replace' }).run()
  }).then((insertResult) => {
    logger('insertResult', insertResult)
    return true
  })
}
