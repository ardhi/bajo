import _ from 'lodash'

const defaultsDeep = (...args) => {
  // taken from https://github.com/nodeutils/defaults-deep/blob/master/lib/index.js
  var output = {}
  args.reverse().forEach(function (item) {
    _.mergeWith(output, item, function (objectValue, sourceValue) {
      return _.isArray(sourceValue) ? sourceValue : undefined
    })
  })
  return output
}

export default defaultsDeep
