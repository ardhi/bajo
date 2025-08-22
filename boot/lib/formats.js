/**
 * @typedef {Object} DataType
 * @type {Array}
 * @property {string} 0 - string
 * @property {string} 1 - float
 * @property {string} 2 - double
 * @property {string} 3 - integer
 * @property {string} 4 - smallint
 * @property {string} 5 - date
 * @property {string} 6 - time
 * @property {string} 7 - datetime
 * @property {string} 8 - array
 * @property {string} 9 - object
 * @property {string} 10 - auto
 */

/**
 * @typedef {Object} FormatType
 * @type {Array}
 * @property {string} 0 - speed
 * @property {string} 1 - distance
 * @property {string} 3 - area
 * @property {string} 4 - degree
 */
export const types = ['speed', 'distance', 'area', 'degree']

export const formats = {
  metric: {
    speedFn: (val) => val,
    speedUnit: 'kmh',
    distanceFn: (val) => val,
    distanceUnit: 'km',
    areaFn: (val) => val,
    areaUnit: 'km²',
    degreeFn: (val) => val,
    degreeUnit: '°',
    degreeUnitSep: ''
  },
  imperial: {
    speedFn: (val) => val / 1.609,
    speedUnit: 'mih',
    distanceFn: (val) => val / 1.609,
    distanceUnit: 'mi',
    areaFn: (val) => val / 2.59,
    areaUnit: 'mi²',
    degreeFn: (val) => val,
    degreeUnit: '°',
    degreeUnitSep: ''
  },
  nautical: {
    speedFn: (val) => val / 1.852,
    speedUnit: 'knot',
    distanceFn: (val) => val / 1.852,
    distanceUnit: 'nm',
    areaFn: (val) => val / 2.92,
    areaUnit: 'nm²',
    degreeFn: (val) => val,
    degreeUnit: '°',
    degreeUnitSep: ''
  }
}
