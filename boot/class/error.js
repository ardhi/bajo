import lodash from 'lodash'
const { isPlainObject, each, isArray, get, isEmpty, merge } = lodash

Error.stackTraceLimit = 15

class BajoError {
  constructor (plugin, msg, ...args) {
    this.plugin = plugin
    this.payload = args.length > 0 && isPlainObject(args[args.length - 1]) ? args[args.length - 1] : {}
    this.orgMessage = msg
    this.message = this.payload.noTrans ? msg : plugin.print.write(msg, ...args)
    this.write()
  }

  write = () => {
    let err
    if (this.payload.class) err = this.payload.class(this.message)
    else err = Error(this.message)
    delete this.payload.class
    const stacks = err.stack.split('\n')
    stacks.splice(1, 1)
    stacks.splice(1, 1)
    err.stack = stacks.join('\n')
    const values = {}
    for (const key in this.payload) {
      const value = this.payload[key]
      if (key === 'details' && isArray(value)) {
        const result = this.formatErrorDetails(value)
        if (result) merge(values, result)
      }
      err[key] = value
    }
    if (!isEmpty(values)) err.values = values
    err.ns = this.plugin.name
    err.orgMessage = this.orgMessage
    return err
  }

  fatal = () => {
    const err = this.write()
    console.error(err)
    process.kill(process.pid, 'SIGINT')
  }

  formatErrorDetails = (value) => {
    const { isString } = this.plugin.app.bajo.lib._
    const result = {}
    const me = this
    this.plugin.app.dump(value)
    each(value, (v, i) => {
      const print = me.plugin.print
      if (isString(v)) v = { error: v }
      if (!v.context) return undefined
      v.context.message = v.message
      // if (v.type === 'any.only') v.context.ref = print.write(`field.${get(v, 'context.valids.0.key')}`)
      if (v.type === 'any.only') v.context.ref = get(v, 'context.valids', []).join(', ')
      const field = get(v, 'context.key')
      const val = get(v, 'context.value')
      value[i] = {
        field,
        error: print.write(`validation.${v.type}`, v.context ?? {}, {}),
        value: val,
        ext: { type: v.type, context: v.context }
      }
    })
    return result
  }
}

export default BajoError
