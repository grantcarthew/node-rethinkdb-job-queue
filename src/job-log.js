module.exports = function (date, qid, type, oldValue, newValue, message) {
  return {
    date,
    qid,
    type,
    oldValue,
    newValue,
    message
  }
}
