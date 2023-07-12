import Sprintf from 'sprintf-js'
import _ from 'lodash'

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

const error = (msg = 'Internal server error', ...args) => {
  let payload = _.last(args)
  let kill = null
  if (_.isString(payload) && payload.startsWith('>') && payload.endsWith('<')) {
    kill = payload.slice(1, payload.length - 1)
    args.pop()
    payload = args.pop()
  } else if (_.isPlainObject(payload)) payload = args.pop()
  const err = new Error(Sprintf.sprintf(msg, ...args))
  if (payload) {
    for (const key in payload) {
      err[key] = payload[key]
    }
  }
  if (kill !== null) {
    console.error(err.message)
    if (!_.isEmpty(kill)) console.error(kill)
    process.exit(1)
  }
  return err
}

export default error
