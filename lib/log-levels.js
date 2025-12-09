/**
 * @typedef {Object} TLogLevels
 * @type {Object}
 * @property {Object} trace
 * @property {number} [trace.number=10]
 * @property {string} [trace.color=gray]
 * @property {Object} debug
 * @property {number} [debug.number=20]
 * @property {string} [debug.color=greenBright]
 * @property {Object} info
 * @property {number} [info.number=30]
 * @property {string} [info.color=blueBright]
 * @property {Object} warn
 * @property {number} [warn.number=40]
 * @property {string} [warn.color=yellowBright]
 * @property {Object} error
 * @property {number} [error.number=50]
 * @property {string} [error.color=redBright]
 * @property {Object} fatal
 * @property {number} [fatal.number=60]
 * @property {string} [fatal.color=magentaBright]
 * @property {Object} silent
 * @property {number} [silent.number=99]
 * @property {string} [silent.color=white]
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
