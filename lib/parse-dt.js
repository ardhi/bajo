import dayjs from 'dayjs'

/**
 * Parse datetime string as Javascript date object. Please visit {@link https://day.js.org|dayjs} for valid formats and more infos
 *
 * @method
 * @memberof module:Lib
 * @param {string} dt - Datetime string
 * @returns {Object} Javascript date object
 * @see {@link https://day.js.org|dayjs}
 */
function parseDt (dt) {
  const value = dayjs(dt)
  if (!value.isValid()) throw new Error(`Date/time '${dt}`)
  return value.toDate()
}

export default parseDt
