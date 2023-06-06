module.exports = {
  handler: function (input) {
    return ![null, undefined].includes(input)
  },
  noScope: true
}