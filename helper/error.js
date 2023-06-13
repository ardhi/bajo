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

function error (msg, { code } = {}) {
  const err = new Error(msg)
  if (code) err.code = code
  return err
}

module.exports = {
  handler: error,
  noScope: true
}