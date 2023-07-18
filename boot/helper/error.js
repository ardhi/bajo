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

Error.stackTraceLimit = 15

function error (msg = 'Internal server error', ...args) {
  let payload = last(args)
  if (isPlainObject(payload)) payload = args.pop()
  const message = print.__.call(this, msg, ...args)
  let err
  if (payload && payload.class) err = payload.class(message)
  else err = Error(message)
  const stacks = err.stack.split('\n')
  stacks.splice(1, 1) // this file
  if (stacks[1].includes('/helper/fatal.js')) stacks.splice(1, 1) // if it goes to fatal.js
  stacks.splice(1, 1) // for buildHelper.js
  err.stack = stacks.join('\n')
  if (payload) {
    delete payload.class
    for (const key in payload) {
      err[key] = payload[key]
    }
  }
  return err
}

export default error
