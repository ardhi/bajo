const path = require('path')

module.exports = {
  handler: function (item, useSlash = true) {
    item = path.resolve(item)
    if (useSlash) item = item.replace(/\\/g, '/')
    return item
  },
  noScope: true
}
