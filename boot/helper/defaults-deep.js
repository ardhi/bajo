import _ from 'lodash'
// taken from https://github.com/nodeutils/defaults-deep/blob/master/lib/index.js

const defaultsDeep = (...args) => {
  var output = {}
  args.reverse().forEach(function (item) {
    _.mergeWith(output, item, function (objectValue, sourceValue) {
      return _.isArray(sourceValue) ? sourceValue : undefined
    })
  })
  return output
}

export default defaultsDeep
