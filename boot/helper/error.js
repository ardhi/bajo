import { last, isPlainObject } from 'lodash-es'
import print from './print.js'

/**
 * It's a shortcut to create an instance of Error with message and optional parameter
 * in a single line
 *
 * @memberof helper
 * @type Object
 * @instance
 * @param {string} msg - String that will be used as error message
 * @param {options} [options] - Optional parameter
 * @param {string} [options.code] - Error code
 * @returns {error} Instance of Error
 */

function error (msg = 'Internal server error', ...args) {
  let payload = last(args)
  if (isPlainObject(payload)) payload = args.pop()
  const err = new Error(print.__.call(this, msg, ...args))
  if (payload) {
    for (const key in payload) {
      err[key] = payload[key]
    }
  }
  return err
}

export default error
