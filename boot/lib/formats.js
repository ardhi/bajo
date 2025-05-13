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
