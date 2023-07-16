import { mergeWith, isArray } from 'lodash-es'
// taken from https://github.com/nodeutils/defaults-deep/blob/master/lib/index.js

const defaultsDeep = (...args) => {
  var output = {}
  args.reverse().forEach(function (item) {
    mergeWith(output, item, function (objectValue, sourceValue) {
      return isArray(sourceValue) ? sourceValue : undefined
    })
  })
  return output
}

export default defaultsDeep
