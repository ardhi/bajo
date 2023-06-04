module.exports = {
  handler: function (input) {
    return !(input === null || input === undefined)
  },
  noScope: false
}