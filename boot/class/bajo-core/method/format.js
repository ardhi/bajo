function format (value, type, lang, options = {}) {
  const { defaultsDeep } = this.app.bajo
  const { format } = this.config.intl
  const { emptyValue = format.emptyValue } = options
  if ([undefined, null, ''].includes(value)) return emptyValue
  if (type === 'auto') {
    if (value instanceof Date) type = 'datetime'
  }
  if (['integer', 'smallint'].includes(type)) {
    value = parseInt(value)
    if (isNaN(value)) return emptyValue
    const setting = defaultsDeep(options.integer, format.integer)
    return new Intl.NumberFormat(lang, setting).format(value)
  }
  if (['float', 'double'].includes(type)) {
    value = parseFloat(value)
    if (isNaN(value)) return emptyValue
    if (this.app.bajoSpatial && options.latitude) return this.app.bajoSpatial.latToDms(value)
    if (this.app.bajoSpatial && options.longitude) return this.app.bajoSpatial.lngToDms(value)
    const setting = defaultsDeep(options.float, format.float)
    return new Intl.NumberFormat(lang, setting).format(value)
  }
  if (['datetime', 'date'].includes(type)) {
    const setting = defaultsDeep(options[type], format[type])
    return new Intl.DateTimeFormat(lang, setting).format(new Date(value))
  }
  if (['time'].includes(type)) {
    const setting = defaultsDeep(options.time, format.time)
    return new Intl.DateTimeFormat(lang, setting).format(new Date(`1970-01-01T${value}Z`))
  }
  if (['array'].includes(type)) return value.join(', ')
  if (['object'].includes(type)) return JSON.stringify(value)
  return value
}

export default format
