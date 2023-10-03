import { cloneDeep, isPlainObject } from 'lodash-es'
import { customAlphabet } from 'nanoid'

const generateId = (options = {}) => {
  let { pattern, length = 21, returnInstance } = options
  let opts = {}
  if (isPlainObject(pattern)) {
    opts = cloneDeep(pattern)
    returnInstance = opts.returnInstance
    length = opts.length
    pattern = opts.pattern
  }
  pattern = pattern ?? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  if (opts.lowerCase) pattern = pattern.toLowerCase()
  else if (opts.upperCase) pattern = pattern.toUpperCase()
  const nid = customAlphabet(pattern, length)
  return returnInstance ? nid : nid()
}

export default generateId
