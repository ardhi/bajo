import { customAlphabet } from 'nanoid'

/**
 * Generate unique random characters that can be used as ID. Use {@link https://github.com/ai/nanoid|nanoid} under the hood
 *
 * @method
 * @memberof module:Lib
 * @param {(boolean|string|Object)} [options={}] - Options. If set to ```true``` or ```alpha```, it will generate alphaphet only characters. If set to ```int```, it will generate integer only characters. Otherwise:
 * @param {string} [options.pattern] - Character pattern to use. Defaults to all available alphanumeric characters
 * @param {number} [options.length=13] - Length of resulted characters
 * @param {string} [options.case] - If set to ```lower``` to use lower cased pattern only. For upper cased pattern, set it to ```upper```
 * @param {boolean} [options.returnInstance] - Set to ```true``` to return {@link https://github.com/ai/nanoid|nanoid} instance instead of string
 * @returns {(string|Object)} Return string or instance of {@link https://github.com/ai/nanoid|nanoid}
 */
function generateId (options = {}) {
  let type
  if (options === true) options = 'alpha'
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
