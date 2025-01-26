import lodash from 'lodash'

const { mergeWith, isArray } = lodash

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
