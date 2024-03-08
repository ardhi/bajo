import { last, isPlainObject, each, isArray, get } from 'lodash-es'
import getPluginName from './get-plugin-name.js'

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

function formatErrorDetails (value, ns) {
  const { print } = this.bajo.helper
  each(value, (v, i) => {
    if (!v.context) {
      v.error = print.__(v.error, { ns })
      return undefined
    }
    v.context.message = v.message
    if (v.type === 'any.only') v.context.ref = print.__(`field.${get(v, 'context.valids.0.key')}`, { ns })
    value[i] = {
      field: get(v, 'context.key'),
      error: print.__(`validation.${v.type}`, v.context, { ns })
    }
  })
}

function error (msg = 'Internal server error', ...args) {
  const { print } = this.bajo.helper
  let payload = last(args)
  let ns
  if (isPlainObject(payload)) {
    payload = args.pop()
    ns = payload.ns
  }
  if (!ns) ns = getPluginName.call(this, 3)
  const orgMsg = msg
  args.push({ ns })
  const message = print.__(msg, ...args)
  let err
  if (isPlainObject(payload) && payload.class) err = payload.class(message)
  else err = Error(message)
  const stacks = err.stack.split('\n')
  stacks.splice(1, 1) // this file
  if (stacks[1].includes('/helper/fatal.js')) stacks.splice(1, 1) // if it goes to fatal.js
  stacks.splice(1, 1) // for buildHelper.js
  err.stack = stacks.join('\n')
  if (isPlainObject(payload)) {
    delete payload.class
    delete payload.ns
    for (const key in payload) {
      const value = payload[key]
      if (key === 'details' && isArray(value) && orgMsg === 'Validation Error') {
        formatErrorDetails.call(this, value, ns)
      }
      err[key] = value
    }
  }
  return err
}

export default error
