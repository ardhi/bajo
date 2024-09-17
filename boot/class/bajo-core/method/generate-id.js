import { customAlphabet } from 'nanoid'

const generateId = (options = {}) => {
  let type
  if (options === 'int') {
    type = options
    options = { pattern: '0123456789', length: 15 }
  } else if (options === 'alpha') {
    type = options
    options = { pattern: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', length: 15 }
  }
  let { pattern, length = 13, returnInstance } = options
  pattern = pattern ?? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  if (options.case === 'lower') pattern = pattern.toLowerCase()
  else if (options.case === 'upper') pattern = pattern.toUpperCase()
  const nid = customAlphabet(pattern, length)
  if (returnInstance) return nid
  const value = nid()
  return type === 'int' ? parseInt(value) : value
}

export default generateId
