export default {
  handler: function (object, value) {
    return Object.keys(object).find(key => object[key] === value)
  },
  noScope: true
}