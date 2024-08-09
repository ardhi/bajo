import { mergeWith, isArray } from 'lodash-es'
// based on https://github.com/nodeutils/defaults-deep/blob/master/lib/index.js

const defaultsDeep = (...args) => {
  const output = {}
  args.reverse().forEach(function (item) {
    mergeWith(output, item, function (objectValue, sourceValue) {
      return isArray(sourceValue) ? sourceValue : undefined
    })
  })
  return output
}

export default defaultsDeep
