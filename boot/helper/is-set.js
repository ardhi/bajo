export default {
  handler: function (input) {
    return ![null, undefined].includes(input)
  },
  noScope: true
}