/**
 * @typedef {Object} LogLevelsType
 * @type {Object}
 * @property {Object} trace
 * @property {Object} debug
 * @property {Object} info
 * @property {Object} warn
 * @property {Object} error
 * @property {Object} fatal
 * @property {Object} silent
*/

export default {
  trace: { number: 10, color: 'gray' },
  debug: { number: 20, color: 'greenBright' },
  info: { number: 30, color: 'blueBright' },
  warn: { number: 40, color: 'yellowBright' },
  error: { number: 50, color: 'redBright' },
  fatal: { number: 60, color: 'magentaBright' },
  silent: { number: 99, color: 'white' }
}
