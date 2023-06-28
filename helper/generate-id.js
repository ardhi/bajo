export default function ({ pattern, length = 21, returnInstance } = {}) {
  const { _, nanoid } = this.bajo.helper
  const { customAlphabet } = nanoid
  let opts = {}
  if (_.isPlainObject(pattern)) {
    opts = _.cloneDeep(pattern)
    returnInstance = opts.returnInstance
    length = opts.length
    pattern = opts.pattern
  }
  pattern = pattern || 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  if (opts.lowerCase) pattern = 'abcdefghijklmnopqrstuvwxyz0123456789'
  else if (opts.upperCase) pattern = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  length = length || 11
  const nid = customAlphabet(pattern, length)
  return returnInstance ? nid : nid()
}