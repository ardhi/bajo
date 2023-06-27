import util from 'util'

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

function error (msg = 'Internal server error', ...args) {
  const payload = args.pop()
  const err = new Error(util.format(msg, ...args))
  if (payload) {
    for (const key in payload) {
      err[key] = payload[key]
    }
  }
  return err
}

export default {
  handler: error,
  noScope: true
}