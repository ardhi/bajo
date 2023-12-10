import path from 'path'
import { isString, isFunction, keys, camelCase, kebabCase, snakeCase } from 'lodash-es'
import pascalCase from './pascal-case.js'
const converter = { camelCase, kebabCase, snakeCase, pascalCase }

function buildName (file, options = {}) {
  if (isString(options)) options = { base: options }
  if (!options.base) options.base = path.dirname(file)
  if (!keys(converter).includes(options.converter)) options.converter = 'camelCase'
  let name = file.replace(options.base, '')
  name = name.slice(0, name.indexOf(path.extname(name)))
  if (isFunction(options.converter)) name = options.converter.call(this, name)
  else name = converter[options.converter](name)
  return name
}

export default buildName
