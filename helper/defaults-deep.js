import _ from 'lodash'

export default {
  handler: function () {
    // taken from https://github.com/nodeutils/defaults-deep/blob/master/lib/index.js
    var output = {}
    _.toArray(arguments).reverse().forEach(function (item) {
      _.mergeWith(output, item, function (objectValue, sourceValue) {
        return _.isArray(sourceValue) ? sourceValue : undefined
      })
    })
    return output
  },
  noScope: true
}