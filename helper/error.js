module.exports = {
  handler: function (msg, { code } = {}) {
    const err = new Error(msg)
    if (code) err.code = code
    return err
  },
  noScope: true
}