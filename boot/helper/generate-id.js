import { cloneDeep, isPlainObject } from 'lodash-es'
import { customAlphabet } from 'nanoid'

const generateId = ({ pattern, length = 21, returnInstance } = {}) => {
  let opts = {}
  if (isPlainObject(pattern)) {
    opts = cloneDeep(pattern)
    returnInstance = opts.returnInstance
    length = opts.length
    pattern = opts.pattern
  }
  pattern = pattern ?? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  if (opts.lowerCase) pattern = 'abcdefghijklmnopqrstuvwxyz0123456789'
  else if (opts.upperCase) pattern = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const nid = customAlphabet(pattern, length)
  return returnInstance ? nid : nid()
}

export default generateId
