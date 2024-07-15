import { isPlainObject, each, isArray, get, isEmpty, merge } from 'lodash-es'

Error.stackTraceLimit = 15

class BajoError {
  constructor (plugin, msg, ...args) {
    this.plugin = plugin
    this.payload = args.length > 0 && isPlainObject(args[args.length - 1]) ? args[args.length - 1] : {}
    this.orgMessage = msg
    this.message = this.plugin.print.write(msg, ...args)
    this.write()
  }

  write (fatal) {
    let err
    if (this.payload.class) err = this.payload.class(this.message)
    else err = Error(this.message)
    delete this.payload.class
    const stacks = err.stack.split('\n')
    /*
    stacks.splice(1, 1) // this file
    if (fatal) stacks.splice(1, 1) // if it goes fatal
    stacks.splice(1, 1)
    */
    err.stack = stacks.join('\n')
    const values = {}
    for (const key in this.payload) {
      const value = this.payload[key]
      if (key === 'details' && isArray(value) && this.orgMessage === 'Validation Error') {
        const result = this.formatErrorDetails(value)
        if (result) merge(values, result)
      }
      err[key] = value
    }
    if (!isEmpty(values)) err.values = values
    return err
  }

  formatErrorDetails (value) {
    const result = {}
    const me = this
    each(value, (v, i) => {
      const print = me.plugin.print
      if (!v.context) {
        v.error = print.write(v.error)
        return undefined
      }
      v.context.message = v.message
      if (v.type === 'any.only') v.context.ref = print.write(`field.${get(v, 'context.valids.0.key')}`)
      const field = get(v, 'context.key')
      const val = get(v, 'context.value')
      value[i] = {
        field,
        error: print.write(`validation.${v.type}`, v.context),
        value: val
      }
    })
    return result
  }
}

export default BajoError
