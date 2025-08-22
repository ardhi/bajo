import lodash from 'lodash'
const { isPlainObject, each, isArray, get, isEmpty, merge } = lodash

Error.stackTraceLimit = 15

/**
 * Bajo Error Class
 */
class BajoError {
  /**
   * Class constructor
   *
   * @param {Object} plugin - Plugin instance
   * @param {string} msg - Error message
   * @param  {...any} [args] - Variables to interpolate with error message. Payload object can be pushed as the very last argument
   */
  constructor (plugin, msg, ...args) {
    this.plugin = plugin
    this.payload = args.length > 0 && isPlainObject(args[args.length - 1]) ? args[args.length - 1] : {}
    this.orgMessage = msg
    this.message = this.payload.noTrans ? msg : plugin.print.write(msg, ...args)
    this.write()
  }

  /**
   * Create the error object
   *
   * @method
   * @returns {Object} Error object
   */
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

  /**
   * Print error object on screen and terminate app process
   *
   * @method
   */
  fatal = () => {
    const err = this.write()
    console.error(err)
    process.kill(process.pid, 'SIGINT')
  }

  /**
   * Pretty format error details
   *
   * @method
   * @param {Object} value - Value to format
   * @returns {Object}
   */
  formatErrorDetails = (value) => {
    const { isString } = this.plugin.app.bajo.lib._
    const result = {}
    const me = this
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
