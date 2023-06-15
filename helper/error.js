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

function error (msg = 'Internal server error', payload) {
  const err = new Error(msg)
  if (payload) {
    for (const key in payload) {
      err[key] = payload[key]
    }
  }
  return err
}

module.exports = {
  handler: error,
  noScope: true
}