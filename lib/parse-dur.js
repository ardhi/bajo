import _ from 'lodash'
import ms from 'ms'
/**
 * Parse duration to its millisecond value. Use {@link https://github.com/vercel/ms|ms} under the hood
 *
 * @method
 * @memberof module:Lib
 * @param {(number|string)} dur - If string is given, parse this to its millisecond value. Otherwise returns as is
 * @returns {number}
 * @see {@link https://github.com/vercel/ms|ms}
 */
function parseDur (dur) {
  return _.isNumber(dur) ? dur : ms(dur)
}

export default parseDur
