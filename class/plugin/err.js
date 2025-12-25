import lodash from 'lodash'
import Tools from './tools.js'

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
class Err extends Tools {
  /**
   * @param {Plugin} plugin - Plugin instance
   * @param {string} msg - Error message
   * @param  {...any} [args] - Variables to interpolate with error message. Payload object can be pushed at the very last argument
   */
  constructor (plugin, msg, ...args) {
    super(plugin)

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
    let detailsMessage
    for (const key in this.payload) {
      const value = this.payload[key]
      if (key === 'details' && isArray(value)) {
        const { result, detailsMessage: dm } = this.formatErrorDetails(value)
        if (!isEmpty(dm)) detailsMessage = dm
        if (result) merge(values, result)
      }
      err[key] = value
    }
    if (!isEmpty(values)) err.values = values
    err.ns = this.plugin.ns
    err.orgMessage = this.orgMessage
    if (detailsMessage) err.detailsMessage = detailsMessage
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
    this.app.exit(true)
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
    const detailsMessage = []
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
      detailsMessage.push(me.plugin.t('fieldError%s%s', field, value[i].error))
    })
    return {
      result,
      detailsMessage: detailsMessage.length > 0 ? (me.plugin.t('error') + ': ' + detailsMessage.join(', ')) : ''
    }
  }
}

export default Err
