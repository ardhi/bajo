import lodash from 'lodash'
import Tools from './tools.js'

const { isPlainObject, each, isArray, get, isEmpty, merge } = lodash

Error.stackTraceLimit = 15

/**
 * Error details object type definition. This type is used to represent detailed information about an error,
 * including the field that caused the error, the error message, the value that caused the error, and any additional context.
 *
 * This type is particularly useful for validation errors, where you want to provide detailed feedback about what went wrong.
 * @typedef TErrDetails
 * @memberof Err
 * @type {Object}
 * @property {string} field - Field name
 * @property {string} error - Error message
 * @property {*} [value] - The value that caused the error
 * @property {Object} [ext] - Additional context about the error
 */

/**
 * Bajo error class, a thin wrapper around the node's Error object.
 *
 * Every Bajo {@link Plugin|plugin} has a built-in method called `error` which basically the shortcut to create a new Err instance.
 * It helps you create this instance anywhere in your code quickly without the hassle of importing & instantiating:
 *
 * ```javascript
 * // anywhere inside your code
 * if (notfound) throw this.error('Sorry, item is nowhere to be found!')
 * ```
 */
class Err extends Tools {
  /**
   * Constructor.
   *
   * @param {Plugin} plugin - Plugin instance
   * @param {string} msg - Error message
   * @param  {...*} [args] - Variables to interpolate with error message. Error's payload can be pushed to the very last argument if needed
   */
  constructor (plugin, msg, ...args) {
    super(plugin)

    /**
     * Error payload extracted from the last arguments, if any
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
   * Write message to the console. Chainable method, returns the Err instance itself.
   *
   * If a payload is provided, it will be merged with the existing payload. If `details` is provided in the payload,
   * it will be formatted and merged to the existing payload and a `detailsMessage` will be generated for display purpose.
   *
   * Original message and translated message will be stored in `orgMessage` and `message` properties respectively.
   *
   * `ns` property will be set to the plugin's namespace.
   *
   * @method
   * @returns {Err} - Error object, useful for chaining
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
   * Print instance on console and terminate process.
   *
   * @method
   */
  fatal = () => {
    const err = this.write()
    console.error(err)
    this.app.exit(true)
  }

  /**
   * Pretty format error details. Used to format error payloads that contain `details` property, which is an array of error details.
   *
   * Formatted error will be applied directly to the value parameter, and a `detailsMessage`
   * will be returned for display purpose.
   *
   * @method
   * @param {Object} value - Value to format
   * @returns {{result: TErrDetails[], detailsMessage: string}} - Formatted result and details message
   */
  formatErrorDetails = (value) => {
    const { isString, last } = this.app.lib._
    const { without } = this.app.lib.aneka
    const result = {}
    const me = this
    const detailsMessage = []
    each(value, (v, i) => {
      if (isString(v)) v = { error: v }
      if (!v.context) {
        v.error = me.plugin.t(v.error)
        return undefined
      }
      v.context.message = v.message
      if (v.type === 'any.only') {
        const items = without(get(v, 'context.valids', []))
        v.context.ref = items.join(', ')
      }
      const field = get(v, 'context.key')
      const val = get(v, 'context.value')
      let error = me.plugin.t(v.message[0] === '~' ? v.message.slice(1) : `validation.${v.type}`, v.context ?? {}, {})
      if (error.includes(' ref:')) {
        const item = last(error.split(' '))
        const [, rfield] = item.split(':')
        error = error.replace(item, `'${me.plugin.t('field.' + rfield)}'`)
      }
      value[i] = {
        field,
        error,
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
