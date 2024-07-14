import { last, isPlainObject, each, isArray, get, isEmpty, merge } from 'lodash-es'

Error.stackTraceLimit = 15

function formatErrorDetails (value, ns) {
  const { print } = this.app.bajo
  const result = {}
  each(value, (v, i) => {
    if (!v.context) {
      v.error = print.write(v.error, { ns })
      return undefined
    }
    v.context.message = v.message
    if (v.type === 'any.only') v.context.ref = print.write(`field.${get(v, 'context.valids.0.key')}`, { ns })
    const field = get(v, 'context.key')
    const val = get(v, 'context.value')
    value[i] = {
      field,
      error: print.write(`validation.${v.type}`, v.context, { ns }),
      value: val
    }
  })
  return result
}

export default function (msg = 'Internal server error', ...args) {
  const { print } = this.app.bajo
  let payload = last(args)
  let ns
  if (isPlainObject(payload)) {
    payload = args.pop()
    ns = payload.ns
  }
  if (!ns) ns = this.name
  const orgMsg = msg
  args.push({ ns })
  const message = print.write(msg, ...args)
  let err
  if (isPlainObject(payload) && payload.class) err = payload.class(message)
  else err = Error(message)
  const stacks = err.stack.split('\n')
  stacks.splice(1, 1) // this file
  if (stacks[1].includes('/method/fatal.js')) stacks.splice(1, 1) // if it goes to fatal.js
  stacks.splice(1, 1) // for buildHelper.js
  err.stack = stacks.join('\n')
  if (isPlainObject(payload)) {
    delete payload.class
    delete payload.ns
    const values = {}
    for (const key in payload) {
      const value = payload[key]
      if (key === 'details' && isArray(value) && orgMsg === 'Validation Error') {
        const result = formatErrorDetails.call(this, value, ns)
        if (result) merge(values, result)
      }
      err[key] = value
    }
    if (!isEmpty(values)) err.values = values
  }
  return err
}
