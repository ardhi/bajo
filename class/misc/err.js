import lodash from 'lodash'
const { isPlainObject, each, isArray, get, isEmpty, merge } = lodash

Error.stackTraceLimit = 15

/**
 * Bajo error class, a thin wrapper of node's Error object.
 *
 * Every Bajo {@link Plugin|plugin} has a built-in method called ```error``` which basically the shortcut to create a new Err instance.
 * It helps you create this instance anywhere in your code quickly without the hassle of importing & instantiating:
 *
 * ```javascript
 * ... anywhere inside your code
 * if (notfound) throw this.error('Sorry, item is nowhere to be found!')
 * ```
 */
class Err {
  /**
   * @param {Plugin} plugin - Plugin instance
   * @param {string} msg - Error message
   * @param  {...any} [args] - Variables to interpolate with error message. Payload object can be pushed at the very last argument
   */
  constructor (plugin, msg, ...args) {
    /**
     * Attached plugin
     * @type {Plugin}
     */
    this.plugin = plugin

    /**
     * The app instance
     * @type {App}
     */
    this.app = plugin.app

    /**
     * Error payload extracted from the last arguments
     * @type {Object}
     */
    this.payload = args.length > 0 && isPlainObject(args[args.length - 1]) ? args[args.length - 1] : {}

    /**
     * Original message before translation
     * @type {string}
     */
    this.orgMessage = msg

    /**
     * Translated message
     * @type {string}
     */
    this.message = this.payload.noTrans ? msg : this.plugin.t(msg, ...args)
    this.write()
  }

  /**
   * Write message to the console
   *
   * @method
   * @returns {Err} Error object, usefull for chaining
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
    err.ns = this.plugin.ns
    err.orgMessage = this.orgMessage
    return err
  }

  /**
   * Print instance on console and terminate process
   *
   * @method
   */
  fatal = () => {
    const err = this.write()
    console.error(err)
    this.app.exit()
  }

  /**
   * Pretty format error details
   *
   * @method
   * @param {Object} value - Value to format
   * @returns {Object}
   */
  formatErrorDetails = (value) => {
    const { isString } = this.app.lib._
    const result = {}
    const me = this
    each(value, (v, i) => {
      if (isString(v)) v = { error: v }
      if (!v.context) return undefined
      v.context.message = v.message
      if (v.type === 'any.only') v.context.ref = get(v, 'context.valids', []).join(', ')
      const field = get(v, 'context.key')
      const val = get(v, 'context.value')
      value[i] = {
        field,
        error: me.plugin.t(`validation.${v.type}`, v.context ?? {}, {}),
        value: val,
        ext: { type: v.type, context: v.context }
      }
    })
    return result
  }
}

export default Err
