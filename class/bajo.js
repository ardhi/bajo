import Tools from './tools.js'
import Plugin from './plugin.js'
import increment from 'add-filename-increment'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import lodash from 'lodash'
import { createRequire } from 'module'
import fastGlob from 'fast-glob'
import querystring from 'querystring'
import { logLevels } from './log.js'
import * as yaml from 'js-yaml'
import aneka from 'aneka'
import {
  buildBaseConfig,
  buildConfig,
  buildPlugins,
  collectConfigHandlers,
  bootOrder,
  checkNameAliases,
  checkDependencies,
  collectHooks,
  runPlugins,
  exitHandler,
  importModule,
  types as formatTypes,
  formats
} from '../lib/helper.js'

const require = createRequire(import.meta.url)

const {
  isFunction, map, isObject, findIndex, uniq, merge, mergeWith,
  trim, filter, isEmpty, orderBy, pullAt, find, camelCase,
  cloneDeep, isPlainObject, isArray, isString, omit, keys, indexOf,
  last, get, has, values, pick, isBoolean
} = lodash

const { resolvePath, getGlobalModuleDir, defaultsDeep, isSet, parseObject } = aneka

/**
 * Name in `{ns}:{path}` format.
 *
 * @typedef {string} TNsPathPairs
 * @memberof Bajo
 * @see Bajo.TNsPathResult
 * @see Bajo#buildNsPath
 * @see Bajo#breakNsPath
 */

/**
 * Object returned by {@link Bajo#getUnitFormat|bajo:getUnitFormat}.
 *
 * @typedef {Object} TFormatResult
 * @memberof Bajo
 * @property {string} unitSys - Unit system.
 * @property {Object} format - Format object.
 * @see Bajo#getUnitFormat
 */

/**
 * Object returned by {@link Bajo#breakNsPath|bajo:breakNsPath()}.
 *
 * @typedef {Object} TNsPathResult
 * @memberof Bajo
 * @property {string} [ns] - Namespace
 * @property {string} [subNs] - Sub namespace
 * @property {string} [subSubNs] - Sub of sub namespace
 * @property {string} [fullNs] - Full namespace, including sub namespaces
 * @property {string} path - Path without query string or hash
 * @property {string} [fullPath] - Full path, including query string and hash
 * @property {string} [realPath] - Path without query string or hash, but with parameters replaced with their values
 * @property {string} [realFullPath] - Full path, including query string and hash, but with parameters replaced with their values
 * @property {Object} [qs] - Query string object
 * @property {Object} [params] - Parameters object
 * @see Bajo.TNsPathPairs
 * @see Bajo#buildNsPath
 * @see Bajo#breakNsPath
 */

/**
 * The core plugin. The main engine. The special plugin that controls the app's boot process and
 * makes sure all other plugins work nicely.
 *
 * Don't create your own instance of this class or {@link App} class. Instead, use the {@link boot} process.
 *
 * @class
 */
class Bajo extends Plugin {
  /**
   * Constructor.
   *
   * @param {App} app - App instance. Usefull to call app method inside a plugin.
   */
  constructor (app) {
    super('bajo', app)

    /**
     * Alias. Read-only
     * @type {string}
     * @default 'bajo'
     */
    this.alias = 'bajo'

    /**
     * Array of white space characters. Used to trim strings
     * @type {string[]}
     */
    this.whiteSpace = [' ', '\t', '\n', '\r']

    /**
     * Configuration object
     * @type {Bajo.TConfig}
     * @see {@tutorial config}
     */
    this.config = {}

    /**
     * Hooks container. This is where all hooks definition are stored.
     * @type {Array<Bajo.THook>}
     */
    this.hooks = []
  }

  /**
   * Bajo boot process. This method is called by the {@link App} class during the app's boot process:
   * 1. Building Bajo's {@link module:Helper.buildBaseConfig|base configuration}
   * 2. Collect all {@link module:Helper.collectConfigHandlers|config handlers} from all loaded plugins
   * 3. Build {@link module:Helper.buildConfig|configuration} object
   * 4. {@link module:Helper.buildPlugins|Building plugins} listed in `package.json` or `.plugins` file
   * 5. Determining the {@link module:Helper.bootOrder|boot order}
   * 6. Ensure the {@link module:Helper.checkNameAliases|uniqueness} of all plugins' name and alias
   * 7. Ensure all plugins {@link module:Helper.checkDependencies|dependencies} are met
   * 8. Collect all {@link module:Helper.collectHooks|hooks} from all loaded plugins
   * 9. {@link module:Helper.runPlugins|Run all plugins} according to the boot order
   * 10. And finally attaching all {@link module:Helper.exitHandler|exit handlers} it could find
   *
   * @method
   * @async
   */
  bootApp = async () => {
    await buildBaseConfig.call(this)
    await collectConfigHandlers.call(this)
    await buildConfig.call(this)
    await buildPlugins.call(this)
    await bootOrder.call(this)
    await checkNameAliases.call(this)
    await checkDependencies.call(this)
    await collectHooks.call(this)
    await runPlugins.call(this)
    await exitHandler.call(this)
    if (this.app.bajoSpatial) {
      this.app.lib.anekaSpatial = await this.importPkg('bajoSpatial:aneka-spatial')
    }
  }

  /**
   * Break file path to its namespace & path infos.
   *
   * @method
   * @param {Object} options - Options object
   * @param {string} [options.file] - File path to break
   * @param {string} [options.dir] - Base directory to remove from file path
   * @param {string} [options.ns] - Namespace to use. If not provided, will be extracted from file path
   * @param {string} [options.suffix] - Suffix to remove from file path
   * @param {boolean} [options.getType] - Whether to extract type from file path
   * @returns {Object} Namespace and path information
   */
  breakNsPathFromFile = (options = {}) => {
    const { file = '', dir = '', ns, suffix = '', getType } = options
    let item = file.replace(dir + suffix, '')
    let type
    if (getType) {
      const items = item.split('/')
      type = items.shift()
      item = items.join('/')
    }
    item = item.slice(0, item.length - path.extname(item).length)
    let [name, _path] = item.split('@')
    if (!_path) {
      _path = name
      name = ns
    }
    _path = camelCase(_path)
    const names = map(name.split('.'), n => camelCase(n))
    const [_ns, subNs] = names
    return { ns: _ns, subNs, path: _path, fullNs: names.join('.'), type }
  }

  /**
   * Build ns/path pairs.
   *
   * @method
   * @param {object} [options={}] - Options object
   * @param {string} [options.ns=''] - Namespace
   * @param {string} [options.subNs] - Sub namespace
   * @param {string} [options.subSubNs] - Sub sub namespace
   * @param {string} [options.path] - Path
   * @returns {TNsPathPairs} Ns/path pairs
   */
  buildNsPath = ({ ns = '', subNs, subSubNs, path } = {}) => {
    if (subNs) ns += '.' + subNs
    if (subSubNs) ns += '.' + subSubNs
    return `${ns}:${path}`
  }

  /**
   * Break `name` to their components.
   *
   * If path starts with `//`, e.g. name is `https://example.com`, it will be treated as a URL and returned as an
   * object with only `path` property filled with the original name.
   *
   * If query string is present in the path, it will be parsed and returned as an object with `qs`
   * property containing the parsed query string.
   *
   * If path contains parameters in the format of `:key|value` or `{key|value}`, they will be extracted and returned
   * as an object with `params` property containing the extracted parameters.
   *
   * This method is one of the most used method in Bajo. It is because every files, names, resources, and even commands
   * are all identified by their namespace and path.
   *
   * @method
   * @param {Bajo.TNsPathPairs} name - Name in format `ns:path`
   * @param {boolean} [checkNs=true] - If `true` (default), check if the namespace exists in the app. If not, throw an error
   * @returns {Bajo.TNsPathResult}
   */
  breakNsPath = (name = '', checkNs = true) => {
    let [ns, ...path] = name.split(':')
    const fullNs = ns
    let subNs
    let subSubNs
    path = path.join(':')
    if (path.startsWith('//')) {
      return { path: name } // for: http:// etc
    }

    [ns, subNs, subSubNs] = ns.split('.')
    if (checkNs) {
      if (!this.app[ns]) {
        const plugin = this.app.getPlugin(ns)
        if (plugin) ns = plugin.ns
      }
      if (!this.app[ns]) throw this.error('unknownPluginOrNotLoaded%s')
    }
    let qs
    [path, qs] = path.split('?')
    qs = querystring.parse(qs) ?? {}
    // normalize path
    const parts = path.split('/')
    const realParts = []
    const params = {}
    for (const idx in parts) {
      const part = parts[idx]
      if (part.indexOf('|') === -1 && ![':', '{'].includes(part[0])) {
        realParts.push(part)
        continue
      }
      let [key, val] = part.split('|')
      if (!val) val = key[0] === '{' ? '}' : ''
      key = key.slice(1)
      val = val[val.length - 1] === '}' ? val.slice(0, val.length - 1) : val
      // parts[idx] = key
      params[key] = val
      realParts.push(isEmpty(val) ? parts[idx] : val)
    }
    path = parts.join('/')
    const realPath = realParts.join('/')
    let fullPath = path
    if (!isEmpty(qs)) fullPath += ('?' + querystring.stringify(qs, null, null, { encodeURIComponent: (text) => (text) }))
    let realFullPath = realPath
    if (!isEmpty(qs)) realFullPath += ('?' + querystring.stringify(qs, null, null, { encodeURIComponent: (text) => (text) }))
    return { ns, path, subNs, subSubNs, qs, params, fullPath, fullNs, realPath, realFullPath }
  }

  /**
   * Method to transform config's array or object into a collection of objects with uniformed structure. This is useful to build a collection of items
   * from config's array or object, e.g. a collection of commands, routes, etc.
   *
   * You typically also provide a `handler` function to transform each item in the collection. The handler function will be called with an object
   * containing the following keys:
   * - `item`: the current item in the collection
   * - `index`: the index of the current item in the collection
   * - `cfg`: the entire config object
   *
   * @method
   * @async
   * @param {Object} [options={}] - Options
   * @param {string} [options.ns='bajo'] - Namespace. If not provided, defaults to `bajo`
   * @param {function} [options.handler] - Function to transform each item while building
   * @param {string[]} [options.dupChecks=[]] - Array of keys to check for duplicates
   * @param {string} options.container - Key used as container name
   * @param {boolean} [options.useDefaultName=true] - If true (default) and `name` key is not provided, returned item will be named `default`
   * @returns {Array<Object>} Returned collection of objects
   * @see module:Hook.{ns}:beforeBuildCollection
   * @see module:Hook.{ns}:afterBuildCollection
   */
  buildCollections = async (options = {}) => {
    const { parseObject } = this.app.lib
    const { ns = this.ns, handler, dupChecks = [], container, useDefaultName = true, noDefault = true } = options
    const cfg = this.app[ns].getConfig()
    let items = get(cfg, container, [])
    if (!isArray(items)) items = [items]
    this.app[ns].log.trace('collecting%s', this.t(container))
    await this.runHook(`${ns}:beforeBuildCollection`, container, items)
    const deleted = []
    for (const index in items) {
      const item = parseObject(items[index])
      if (useDefaultName) {
        if (!has(item, 'name')) {
          if (find(items, { name: 'default' })) throw this.app[ns].error('collExists%s', 'default')
          else item.name = 'default'
        }
      }
      this.app[ns].log.trace('- %s', item.name)
      const result = await handler.call(this.app[ns], { item, index, cfg })
      if (result) items[index] = result
      else if (result === false) deleted.push(index)
      if (this.app.applet && item.skipOnApplet && !deleted.includes(index)) deleted.push(index)
    }
    if (deleted.length > 0) pullAt(items, deleted)

    // check for duplicity
    if (dupChecks.length > 0) {
      const checkers = []
      for (const c of items) {
        const checker = JSON.stringify(pick(c, dupChecks))
        if (checkers.includes(checker)) this.app[ns].fatal('oneOrMoreSharedTheSame%s%s', container, this.join(dupChecks.filter(i => !isFunction(i))))
      }
    }

    if (!noDefault && !items.find(item => item.name === 'default')) this.app[ns].fatal('missing%s%s', 'default', container)
    await this.runHook(`${ns}:afterBuildCollection`, container, items)
    this.app[ns].log.debug('collected%s%d', this.t(container), items.length)
    return items
  }

  /**
   * Calling a function handler in any plugins:
   * - If name is a string, the corresponding plugin's method will be called with passed args as its parameters
   * - If name is a plugin instance, this will be used as the scope instead. The first args is now the handler name and the rest are its parameters
   * - If name is a function, this function will be run under scope with the remaining args
   * - If name is an object and has `handler` key in it, this function handler will be instead
   *
   * @method
   * @async
   * @param {(TNsPathPairs|Plugin|function|Object)} name - Method's name, plugin instance, function handler or plain object. See above for details
   * @param  {...*} [args] - One or more arguments passed as parameter to the handler
   * @returns {Promise<*>} Returned value
   */
  callHandler = async (item, ...args) => {
    let result
    let scope = this
    if (item instanceof Tools || item instanceof Plugin) {
      scope = item
      item = args.shift()
    }
    if (isString(item)) {
      if (item.startsWith('applet:') && this.app.applets.length > 0) {
        const [, ns, path] = item.split(':')
        const applet = find(this.app.applets, a => (a.ns === ns || a.alias === ns))
        if (applet && this.app.bajoCli) result = await this.app.bajoCli.runApplet(applet, path, ...args)
      } else {
        const [ns, method, ...params] = item.split(':')
        const fn = this.getMethod(`${ns}:${method}`)
        if (fn) {
          if (params.length > 0) args.unshift(...params)
          result = await fn(...args)
        }
      }
    } else if (isFunction(item)) {
      result = await item.call(scope, ...args)
    } else if (isPlainObject(item) && isFunction(item.handler)) {
      result = await item.handler.call(scope, ...args)
    }
    return result
  }

  /**
   * This function iterates through all loaded plugins and call the provided handler scoped as the running plugin.
   * And an object with the following key serves as its parameter:
   *
   * - `file`: file matched the glob pattern
   * - `dir`: plugin's base directory
   *
   * @method
   * @async
   * @param {function} handler - Function handler. Can be an async function. Scoped to the running plugin.
   * @param {(string|Object)} [options={}] - Options. If a string is provided, it serves as the glob pattern, otherwise:
   * @param {(string|string[])} [options.glob] - Glob pattern. If provided,
   * @param {boolean} [options.useBajo=false] - If true, add `bajo` to the running plugins too.
   * @param {string} [options.prefix=''] - Prepend glob pattern with prefix.
   * @param {boolean} [options.noUnderscore=true] - If true (default), matched file with name starts with underscore is ignored.
   * @param {*} [options.returnItems] - If true, each value of returned handler call will be saved as an object with running plugin name as its keys.
   * @returns {*}
   */
  eachPlugins = async (handler, options = {}) => {
    if (isString(options)) options = { glob: options }
    const { glob = [], useBajo, prefix = '', noUnderscore = true, returnItems, opts = {} } = options
    const globs = isString(glob) ? [glob] : [...glob]
    const pluginPkgs = useBajo ? [...cloneDeep(this.app.pluginPkgs), 'bajo'] : this.app.pluginPkgs
    const result = {}
    for (const pkgName of pluginPkgs) {
      const ns = camelCase(pkgName)
      let r
      if (globs.length > 0) {
        const base = prefix === '' ? `${this.app[ns].dir.pkg}/extend` : `${this.app[ns].dir.pkg}/extend/${prefix}`
        const patterns = globs.map(glob => {
          return !path.isAbsolute(glob) ? `${base}/${glob}` : glob
        })
        const files = await fastGlob.glob(patterns, opts)
        for (const f of files) {
          if (path.basename(f)[0] === '_' && noUnderscore) continue
          const resp = await handler.call(this.app[ns], { file: f, dir: base })
          if (resp === false) break
          else if (resp === undefined) continue
          else {
            result[ns] = result[ns] ?? {}
            result[ns][f] = resp
          }
        }
      } else {
        r = await handler.call(this.app[ns], { dir: this.app[ns].dir.pkg })
        if (r === false) break
        else if (r === undefined) continue
        else result[ns] = r
      }
    }
    if (returnItems) {
      const data = []
      for (const r in result) {
        for (const f in result[r]) {
          data.push(result[r][f])
        }
      }
      return data
    }
    return result
  }

  /**
   * Get unit format.
   *
   * @method
   * @param {Object} [options={}] - Options.
   * @param {string} [options.lang] - Language to use. Defaults to the one you set in config.
   * @param {string} [options.unitSys] - Unit system to use. Defaults to language's unit system or `metric` if unspecified.
   * @returns {TBajoFormatResult} Returned value.
   */
  getUnitFormat = (options = {}) => {
    const lang = options.lang ?? this.config.lang
    let unitSys = options.unitSys ?? this.config.intl.unitSys[lang] ?? 'metric'
    if (!['imperial', 'nautical', 'metric'].includes(unitSys)) unitSys = 'metric'
    return { unitSys, format: formats[unitSys] }
  }

  /**
   * Format value by type.
   *
   * @method
   * @param {string} type - Format type. See {@link TBajoFormatType} for acceptable values.
   * @param {*} value - Value to format.
   * @param {string} [dataType] - Value's data type. See {@link TBajoDataType} for acceptable values.
   * @param {Object} [options={}] - Options.
   * @param {boolean} [options.withUnit=true] - Return with its unit appended.
   * @param {string} [options.lang] - Format value according to this language. Defaults to the one you set in config.
   * @returns {(Array|string)} Return string if `withUnit` is true. Otherwise is an array of `[value, unit, separator]`.
   */
  formatByType = (type, value, dataType, options = {}) => {
    const { format } = this.getUnitFormat(options)
    const { withUnit = true } = options
    const lang = options.lang ?? this.config.lang
    value = format[`${type}Fn`](value)
    const unit = format[`${type}Unit`]
    const sep = format[`${type}UnitSep`] ?? ' '
    if (!withUnit) return [value, unit, sep]
    const setting = defaultsDeep(options[dataType], this.config.intl.format[dataType])
    value = new Intl.NumberFormat(lang, setting).format(value)
    return `${value}${sep}${unit}`
  }

  /**
   * Format value.
   *
   * @method
   * @param {*} value - Value to format.
   * @param {string} [type] - Data type to use. See {@link TBajoDataType} for acceptable values. If not provided, return the untouched value.
   * @param {Object} [options={}] - Options.
   * @param {string} [options.emptyValue=''] - Empty value to use if function resulted empty. Defaults to the one from your config.
   * @param {boolean} [options.withUnit=true] - Return with its unit appended.
   * @param {string} [options.lang] - Format value according to this language. Defaults to the one you set in config.
   * @param {string} [options.latitude] - If Bajo Spatial is loaded and data type is a double or float, then format it as latitude in degree, minute, second.
   * @param {string} [options.longitude] - If Bajo Spatial is loaded and data type is a double or float, then format it as longitude in degree, minute, second.
   * @returns {string} Formatted value.
   */
  format = (value, type, options = {}) => {
    const { format } = this.config.intl
    const { emptyValue = format.emptyValue } = options
    const lang = options.lang ?? this.config.lang
    options.withUnit = options.withUnit ?? true
    let valueFormatted
    if ([undefined, null, ''].includes(value)) return emptyValue
    if (type === 'auto') {
      if (value instanceof Date) type = 'datetime'
    }
    if (['float', 'double'].includes(type) && this.app.lib.anekaSpatial) {
      const { latToDms, lngToDms } = this.app.lib.anekaSpatial
      if (options.latitude) return latToDms(value)
      if (options.longitude) return lngToDms(value)
    }
    if (['integer', 'smallint', 'float', 'double'].includes(type)) {
      value = ['integer', 'smallint'].includes(type) ? parseInt(value) : parseFloat(value)
      if (isNaN(value)) return emptyValue
      for (const u of formatTypes) {
        if (options[u]) valueFormatted = this.formatByType(u, value, type, options)
      }
    }
    if (['integer', 'smallint'].includes(type)) {
      const setting = defaultsDeep(options.integer, format.integer)
      value = new Intl.NumberFormat(lang, setting).format(Math.round(value))
      return valueFormatted && options.withUnit ? valueFormatted : value
    }
    if (['float', 'double'].includes(type)) {
      const setting = defaultsDeep(options[type], format[type])
      value = new Intl.NumberFormat(lang, setting).format(value)
      return valueFormatted && options.withUnit ? valueFormatted : value
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
    if (['boolean'].includes(type) && isSet(value)) return value ? this.t('true', { lang }) : this.t('false', { lang })
    return value
  }

  /**
   * Get class method by name.
   *
   * @method
   * @param {string} name - Name in format `ns:methodName`.
   * @param {boolean} [thrown=true] - If `true` (default), throw exception in case of error.
   * @returns {function} Class method.
   */
  getMethod = (name = '', thrown = true) => {
    const { ns, path } = this.breakNsPath(name, thrown)
    const method = get(this.app, `${ns}.${path}`)
    if (method && isFunction(method)) return method
    if (thrown) throw this.error('cantFindMethod%s', name)
  }

  /**
   * Get module directory.
   *
   * @method
   * @param {string} pkgName - Package name to find.
   * @param {boolean} [withGlobalDir=true] - Whether to include the global module directory.
   * @returns {string} Return absolute package directory.
   */
  getModuleDir = (pkgName, base, withGlobalDir = true) => {
    const { findDeep } = this.app.lib
    if (pkgName === 'main') return resolvePath(this.app.dir)
    if (base === 'main') base = this.app.dir
    else if (this && this.app && this.app[base]) base = this.app[base].pkgName
    const pkgPath = pkgName + '/package.json'
    const paths = require.resolve.paths(pkgPath)
    if (withGlobalDir) paths.push(getGlobalModuleDir())
    paths.unshift(resolvePath(path.join(this.app.dir, 'node_modules')))
    let dir = findDeep(pkgPath, paths)
    if (base && !dir) dir = findDeep(`${base}/node_modules/${pkgPath}`, paths)
    if (!dir) return null
    return resolvePath(path.dirname(dir))
  }

  /**
   * Import file/module from any loaded plugins.
   *
   * Method proxy from {@link module:Helper.importModule}
   *
   * @method
   * @async
   * @see module:Helper.importModule
   */
  importModule = async (file, { asDefaultImport, asHandler, noCache } = {}) => {
    return await importModule.call(this, file, { asDefaultImport, asHandler, noCache })
  }

  /**
   * Import one or more packages belongs to a plugin.
   *
   * If the last arguments passed is an object, this object serves as options object:
   * - `returnDefault`: should return package's default export. Defaults to `true`
   * - `throwNotFound`: should throw if package is not found. Defaults to `false`
   * - `noCache`: always use fresh import. Defaults to `false`
   * - `asObject`: see below. Defaults to `false`
   *
   * Return value:
   * - if `options.asObject` is `true` (default `false`), return as object with package's names as it's keys
   * - Otherwise depends on how many parameters are provided, it should return the named package or an array of packages
   *
   * Example: you want to import `delay` and `chalk` from `bajo` plugin because you want to use it in your code
   * `javascript
   * const { importPkg } from this.app.bajo
   * const [delay, chalk] = await importPkg('bajo:delay', 'bajo:chalk')
   *
   * await delay(1000)
   * ...
   * `
   *
   * @method
   * @async
   * @param {...TNsPathPairs} pkgs - One or more packages in format `{ns}:{packageName}`.
   * @returns {(Object|Array)} See above.
   */
  importPkg = async (...pkgs) => {
    const result = {}
    const notFound = []
    let opts = { returnDefault: true, throwNotFound: false }
    if (isPlainObject(last(pkgs))) {
      opts = defaultsDeep(pkgs.pop(), opts)
    }
    for (let pkg of pkgs) {
      if (pkg.indexOf(':') === -1) pkg = `bajo:${pkg}`
      const { ns, path: name } = this.breakNsPath(pkg)
      const dir = this.getModuleDir(name, ns)
      if (!dir) {
        notFound.push(pkg)
        continue
      }
      const p = await this.fromJson(`${dir}/package.json`, { readFromFile: true, throwNotFound: opts.throwNotFound })
      const mainFileOrg = dir + '/' + (p.main ?? get(p, 'exports.default', 'index.js'))
      let mainFile = resolvePath(mainFileOrg, os.platform() === 'win32')
      if (isEmpty(path.extname(mainFile))) {
        if (fs.existsSync(`${mainFileOrg}/index.js`)) mainFile += '/index.js'
        else mainFile += '.js'
      }
      if (opts.noCache) mainFile += `?_=${Date.now()}`
      let mod = await import(mainFile)
      if (opts.returnDefault && has(mod, 'default')) {
        mod = mod.default
        if (opts.returnDefault && has(mod, 'default')) mod = mod.default
      }
      result[name] = mod
    }
    if (notFound.length > 0 && opts.throwNotFound) throw this.error('cantFind%s', this.join(notFound))
    if (opts.asObject) return result
    if (pkgs.length === 1) return result[keys(result)[0]]
    return values(result)
  }

  /**
   * Check whether log level is within log's app current level.
   *
   * @method
   * @param {string} level - Level to check. See {@link TLogLevels} for more.
   * @returns {boolean}
   */
  isLogInRange = (level) => {
    const levels = keys(logLevels)
    const logLevel = indexOf(levels, this.app.bajo.config.log.level)
    return indexOf(levels, level) >= logLevel
  }

  isValidAppPlugin = (file, type, returnPkg) => {
    if (isObject(file)) return get(file, 'bajo.type') === type
    file = resolvePath(file)
    if (path.basename(file) !== 'package.json') file += '/package.json'
    try {
      const pkg = fs.readJsonSync(file)
      const valid = get(pkg, 'bajo.type') === type
      if (valid) return returnPkg ? pkg : valid
      return false
    } catch (err) {
      return false
    }
  }

  /**
   * Check whether directory is a valid Bajo app.
   *
   * @method
   * @param {string} dir - Directory to check.
   * @param {boolean} [returnPkg] - Set `true` to return its package.json content.
   * @returns {(boolean|Object)}
   */
  isValidApp = (dir, returnPkg) => {
    if (!dir) dir = this.app.dir
    return this.isValidAppPlugin(dir, 'app', returnPkg)
  }

  /**
   * Check whether directory is a valid Bajo plugin.
   *
   * @method
   * @param {string} dir - Directory to check.
   * @param {boolean} [returnPkg] - Set `true` to return its package.json content.
   * @returns {(boolean|Object)}
   */
  isValidPlugin = (dir, returnPkg) => {
    if (!dir) dir = this.app.dir
    return this.isValidAppPlugin(dir, 'plugin', returnPkg)
  }

  /**
   * Return human friendly joined array of items.
   *
   * @method
   * @param {Array<*>} input - Array to join
   * @param {(string|Object)} [options={}] - If provided and is a string, it will be used as separator.
   * @param {string} [options.separator=', '] - Separator to use.
   * @param {string} [options.lastSeparator='and'] - Text to use as the last separator.
   * @returns {string}
   */
  join = (input = [], options = {}) => {
    const array = [...input]
    if (isString(options)) options = { separator: options }
    const { separator = ', ', lastSeparator = 'and', lang } = options
    const translate = (val) => {
      return this.t(val, { lang }).toLowerCase()
    }
    if (array.length === 0) return translate('none')
    if (array.length === 1) return array[0]
    const last = (array.pop() ?? '').trim()
    return array.map(a => (a + '').trim()).join(separator) + ` ${translate(lastSeparator)} ${last}`
  }

  /**
   * Get numeric portion and its unit from a string.
   *
   * @method
   * @param {string} [value=''] - Value to get its numeric portion
   * @param {string} [defUnit=''] - Default unit if value doesn't have one
   * @returns {string}
   */
  numUnit = (value = '', defUnit = '') => {
    const num = value.match(/\d+/g)
    const unit = value.match(/[a-zA-Z]+/g)
    return `${num[0]}${isEmpty(unit) ? defUnit : unit[0]}`
  }

  /**
   * Read and parse file as config object. Supported types: `.js`, `.json` and `.yml/.yaml`.
   * More supports can be added using plugin. {@link https://ardhi.github.io/bajo-config|bajo-config} gives you additional supports for `.yml`, `.yaml` and `.toml` file.
   *
   * If file extension is `.*`, it will be auto detected and parsed accordingly
   *
   * @method
   * @async
   * @param {string} file - File to read and parse.
   * @param {Object} [options={}] - Options
   * @param {boolean} [options.ignoreError] - Any exception will be silently discarded
   * @param {string} [options.ns] - If provided, scoped to this namespace. Otherwise, the running plugin's namespace will be used
   * @param {string} [options.baseNs] - If provided, it will be used as the base namespace for extending config from other plugins
   * @param {string|string[]|boolean} [options.extend] - If provided, it will be used as the base namespace for extending config from other plugins. Set to `false` to disable extending
   * @param {boolean} [options.checkOverride] - If `true` and `baseNs` is provided or `extend` is not `false`, check for override config in main plugin
   * @param {boolean|string} [options.merge] - If `true`, config from other plugins will be merged into the original config. If `concat`, it performs array concatenation if object is an array. Otherwise, it will perform a deep defaults merge
   * @param {string} [options.pattern] - If provided and auto detection is on (extension is `.*`), it will be used for instead the auto generated one
   * @param {Object} [options.defValue={}] - Default value to use if value returned empty
   * @param {Object} [options.parserOpts={}] - Parser options
   * @param {Object} [options.globOpts={}] - {@link https://github.com/mrmlnc/fast-glob|fast-glob} options
   * @returns {Object}
   */
  readConfig = async (file, options = {}) => {
    let {
      ns, baseNs, extend, checkOverride, merge: merged, pattern, ignoreError = true,
      defValue = {}, parserOpts = {}, globOpts = {}, handler, cache = {}
    } = options

    const getParseOptsArgs = (opts, orig) => {
      opts.parserOpts = opts.parserOpts ?? {}
      opts.parserOpts.args = opts.parserOpts.args ?? []
      const idx = findIndex(opts.parserOpts.args, item => {
        return isPlainObject(item) && Object.keys(item)[0] === '_orig'
      })
      if (idx > -1) opts.parserOpts.args[idx] = { _orig: orig }
      else opts.parserOpts.args.push({ _orig: orig })
    }

    const binder = (...args) => {
      if (merged === 'concat') {
        return mergeWith(...args, (objValue, srcValue) => {
          if (isArray(objValue)) return objValue.concat(srcValue)
        })
      }
      return merged ? merge(...args) : defaultsDeep(...args)
    }

    const output = async (obj) => {
      let orig = parseObject(obj)
      if (!baseNs || extend === false) {
        await this.runHook('bajo.default:afterReadConfig', file, orig, options)
        if (cache.name) await this.app.cache.save(cache.name, orig, cache.ttlDur)
        return orig
      }
      const { suffix = '', keys = [] } = options
      let bases = this.app.getAllNs()
      if (isString(extend)) extend = extend.split(',').map(i => i.trim())
      if (isArray(extend)) bases = [...extend, 'main']
      bases = uniq(bases)
      let ext = isArray(orig) ? [] : {}
      const dir = this.app[ns].dir.pkg
      let [names, _path] = file.split(':')
      if (file.slice(0, names.length + 1) !== `${ns}:`) _path = file.slice(dir.length + 1)
      if (_path.startsWith('extend/')) _path = _path.slice(7)
      if (_path.startsWith(`${baseNs}/`)) _path = _path.slice(baseNs.length + 1)
      _path = _path.slice(0, -(path.extname(_path).length)) + '.*'
      // check for override? Override only exists in main plugin
      const opts = omit(options, ['suffix', 'keys', 'extend'])
      if (checkOverride) {
        getParseOptsArgs(opts, orig)
        const fileExt = `${this.app.main.dir.pkg}/extend/${baseNs}/override/${ns}${suffix}/${_path}`
        await this.runHook('bajo.override:beforeReadConfig', fileExt, options)
        const result = parseObject(await this.readConfig(fileExt, { ...opts, extend: false, checkOverride: false, merge: false }))
        await this.runHook('bajo.override:afterReadConfig', fileExt, result, options)
        if (!isEmpty(result)) orig = result
      }
      getParseOptsArgs(opts, orig)
      for (const base of bases) {
        if (!this.app[base]) continue
        options.sourceNs = base
        const fileExt = `${this.app[base].dir.pkg}/extend/${baseNs}/extend/${ns}${suffix}/${_path}`
        await this.runHook('bajo.extend:beforeReadConfig', fileExt, orig, options)
        const result = parseObject(await this.readConfig(fileExt, { ...opts, extend: false, merge: false }))
        await this.runHook('bajo.extend:afterReadConfig', fileExt, orig, result, options)
        if (isEmpty(result)) continue
        if (isArray(result)) ext = [...result, ...ext]
        else ext = binder({}, result, ext)
      }
      delete options.sourceNs
      let result = isArray(orig) ? [...orig, ...ext] : binder({}, keys.length > 0 ? pick(ext, keys) : ext, orig)
      if (handler) result = await this.callHandler(this.app[ns], handler, result)
      await this.runHook('bajo:afterReadConfig', file, result, options)
      if (cache.name) await this.app.cache.save(cache.name, result, cache.ttlDur)
      return result
    }

    let result
    if (cache.name) result = await this.app.cache.load(cache.name, cache.ttlDur)
    if (result) return result
    await this.runHook('bajo:beforeReadConfig', file, options)
    const readOpts = {
      readFromFile: true,
      throwNotFound: !ignoreError,
      defValue,
      parserOpts
    }
    if (!ns) ns = this.ns
    file = resolvePath(this.app.getPluginFile(file))
    let ext = path.extname(file)
    const fname = path.dirname(file) + '/' + path.basename(file, ext)
    ext = ext.toLowerCase()
    if (!['', '.*'].includes(ext)) {
      const item = find(this.app.configHandlers, { ext })
      if (!item) {
        if (!ignoreError) throw this.error('cantParse%s', file, { code: 'BAJO_CONFIG_NO_PARSER' })
        return await output(defValue)
      }
      return await output(await item.readHandler.call(this.app[item.ns], file, readOpts))
    }
    const formats = this.app.getConfigFormats(true)
    const item = pattern ?? `${fname}.{${formats.join(',')}}`
    const files = await fastGlob(item, globOpts ?? {})
    if (files.length === 0) {
      if (!ignoreError) throw this.error('noConfigFileFound', { code: 'BAJO_CONFIG_FILE_NOT_FOUND' })
      return await output(defValue)
    }
    let config = defValue
    for (const f of files) {
      const ext = path.extname(f).toLowerCase()
      const item = find(this.app.configHandlers, { ext })
      if (!item) {
        if (!ignoreError) throw this.error('cantParse%s', f, { code: 'BAJO_CONFIG_NO_PARSER' })
        continue
      }
      const _ns = ['.js', '.json'].includes(ext) ? ns : item.ns
      config = await item.readHandler.call(this.app[_ns], f, readOpts)
      if (!isEmpty(config)) break
    }
    return await output(config)
  }

  /**
   * Read and parse JavaScript file.
   *
   * @async
   * @method
   * @param {string} file - File to read and parse
   * @param {boolean} [options.readFromFile=false] - Ignored for this method. Always read from file.
   * @param {boolean} [options.throwNotFound=false] - If `true`, throw exception if file is not found
   * @param {object} [options.defValue={}] - Default value to use if value returned empty
   * @param {object} [options.parserOpts={}] - Options to be passed if file exports a function
   * @returns {Object} Parsed JavaScript object
   */
  async fromJs (file, options = {}) {
    if (isBoolean(options)) options = {}
    options.defValue = options.defValue ?? {}
    if (options.throwNotFound && !fs.existsSync(file)) throw this.error('notFound%s%s', this.t('file'), file)
    let mod = await importModule(file)
    if (isFunction(mod)) mod = await mod.call(this, options.parserOpts)
    return isEmpty(mod) ? options.defValue : mod
  }

  /**
   * Parse JSON string or read and parse JSON file.
   *
   * @async
   * @method
   * @param {string} text - Text to be parsed or file path to be read if `options.readFromFile` is `true`
   * @param {object|boolean} [options={}] - Options object. If a boolean is provided, it will be treated as `options.readFromFile`
   * @param {boolean} [options.readFromFile=false] - If `true`, `text` is treated as a file path
   * @param {boolean} [options.throwNotFound=false] - If `true`, throw exception if file is not found
   * @param {object} [options.defValue={}] - Default value to use if value returned empty
   * @param {object} [options.parserOpts={}] - Options to be passed to `JSON.parse()`
   * @returns {Object} Parsed object.
   * @see Bajo#toJson
   */
  async fromJson (text, options = {}) {
    if (isBoolean(options)) options = { readFromFile: options }
    options.defValue = options.defValue ?? {}
    if (options.readFromFile && !fs.existsSync(text) && options.throwNotFound) throw this.error('notFound%s%s', this.t('file'), text)
    const content = options.readFromFile ? fs.readFileSync(text, 'utf8') : text
    const result = JSON.parse(content)
    return isEmpty(result) ? options.defValue : result
  }

  /**
   * Parse YAML text or read and parse YAML file.
   *
   * @async
   * @method
   * @param {string} text - Text to be parsed or file path to be read if `options.readFromFile` is `true`
   * @param {object|boolean} [options={}] - Options object. If a boolean is provided, it will be treated as `options.readFromFile`
   * @param {boolean} [options.readFromFile=false] - If `true`, `text` is treated as a file path
   * @param {boolean} [options.throwNotFound=false] - If `true`, throw exception if file is not found
   * @param {object} [options.parserOpts={}] - Options to be passed to `YAML.load()`
   * @param {object} [options.defValue={}] - Default value to use if value returned empty
   * @returns {object} Parsed object
   * @see Bajo#toYaml
   */
  async fromYaml (text, options = {}) {
    if (isBoolean(options)) options = { readFromFile: options }
    options.defValue = options.defValue ?? {}
    if (options.readFromFile && !fs.existsSync(text) && options.throwNotFound) throw this.error('notFound%s%s', this.t('file'), text)
    const content = options.readFromFile ? fs.readFileSync(text, 'utf8') : text
    const result = yaml.load(content)
    return isEmpty(result) ? options.defValue : result
  }

  /**
   * Parse YML text or read and parse YML file. Alias for {@link Bajo#fromYaml}.
   *
   * @async
   * @method
   * @param {string} text - Text to be parsed or file path to be read if `options.readFromFile` is `true`
   * @param {object|boolean} [options={}] - Options object. If a boolean is provided, it will be treated as `options.readFromFile`
   * @param {boolean} [options.readFromFile=false] - If `true`, `text` is treated as a file path
   * @param {boolean} [options.throwNotFound=false] - If `true`, throw exception if file is not found
   * @param {object} [options.defValue={}] - Default value to use if value returned empty
   * @param {object} [options.parserOpts={}] - Options to be passed to `YAML.load()`
   * @returns {object} Parsed object
   * @see Bajo#toYml
   */
  async fromYml (text, options = {}) {
    return this.fromYaml(text, options)
  }

  /**
   * Convert data to JSON string, optionally write to file if `options.writeToFile` is provided.
   *
   * @async
   * @method
   * @param {Object} data - Data to convert to JSON string
   * @param {Object|string} [options={}] - Options object. If a string is provided, it will be treated as `options.writeToFile`
   * @param {string} [options.writeToFile] - If not empty, write result to this file path instead of returning it as string
   * @param {Object} [options.parserOpts={}] - Options for `JSON.stringify()`
   * @returns {Promise<string|void>} JSON string or void if written to file
   * @see Bajo#fromJson
   */
  async toJson (data, options = {}) {
    if (isString(options)) options = { writeToFile: options }
    options.parserOpts = options.parserOpts ?? {}
    options.parserOpts.space = options.parserOpts.space ?? 2
    const content = JSON.stringify(data, null, options.parserOpts)
    if (isString(options.writeToFile)) {
      fs.writeFileSync(options.writeToFile, content, 'utf8')
      return
    }
    return content
  }

  /**
   * Convert object to YAML string, optionally write to file if `options.writeToFile` is provided.
   *
   * @async
   * @method
   * @param {object} object - Object to be converted
   * @param {object|string} [options] - Options object. If a string is provided, it will be treated as `options.writeToFile`
   * @param {string} [options.writeToFile] - If not empty, write result to this file path instead of returning it as string
   * @param {Object} [options.parserOpts={}] - Options for `YAML.dump()`
   * @returns {Promise<string|void>} YAML string or void if written to file
   * @see Bajo#fromYaml
   */
  async toYaml (object, options = {}) {
    if (isString(options)) options = { writeToFile: options }
    options.parserOpts = options.parserOpts ?? {}
    const content = yaml.dump(object, options.parserOpts)
    if (options.writeToFile) {
      if (isString(options.writeToFile)) {
        fs.writeFileSync(options.writeToFile, content, 'utf8')
        return
      }
    }
    return content
  }

  /**
   * Convert object to YML string, optionally write to file if `options.writeToFile` is provided. Alias for {@link Bajo#toYaml}.
   * @async
   * @method
   * @param {object} object - Object to be converted
   * @param {object|string} [options] - Options object. If a string is provided, it will be treated as `options.writeToFile`
   * @param {string} [options.writeToFile] - If not empty, write result to this file path instead of returning it as string
   * @param {Object} [options.parserOpts={}] - Options for `YAML.dump()`
   * @returns {Promise<string|void>} YAML string or void if written to file
   * @see Bajo#fromYml
   */
  async toYml (object, options = {}) {
    return this.toYaml(object, options)
  }

  /**
   * Read all forms of configuration files from file path.
   *
   * Internally, it will call {@link Bajo#readConfig} twice, first for the default config file and
   * second for the environment based config file. Then it will merge both results using `defaultsDeep`.
   *
   * @method
   * @async
   * @param {string} path - Base path to start looking config files.
   * @param {Object} [options={}] - Options. See {@link Bajo#readConfig} for more.
   * @returns {Object} Merged configuration object.
   */
  readAllConfigs = async (path, options) => {
    let cfg = {}
    let ext = {}
    // default config file
    try {
      cfg = await this.readConfig(`${path}.*`, options)
    } catch (err) {
      if (['BAJO_CONFIG_NO_PARSER'].includes(err.code)) throw err
    }
    // env based config file
    try {
      ext = await this.readConfig(`${path}-${this.config.env}.*`, options)
    } catch (err) {
      if (!['BAJO_CONFIG_FILE_NOT_FOUND'].includes(err.code)) throw err
    }
    return defaultsDeep({}, ext, cfg)
  }

  /**
   * Run named {@link module:Hook}.
   *
   * If no hook found with the given name, it will return an empty array.
   * If a hook has `noWait` set to `true`, it will not wait for the hook to finish and will not return its result.
   *
   * > **Note**: Even though this method returns a result, it is not recommended to use the result for any purpose.
   * Use the result only for debugging or logging purposes. Hooks are designed to be fast, lightweight and mutate
   * arguments given to them so that the next hook can benefit from the changes.
   *
   * @method
   * @async
   * @param {TNsPathPairs} hookName - Name of the hook to run.
   * @param {...any} [args] - Argument passed to the hook function.
   * @returns {Array} Array of hook execution results.
   */
  runHook = async (hookName, ...args) => {
    let fns = filter(this.hooks, { name: hookName })
    if (isEmpty(fns)) return []
    fns = orderBy(fns, ['level'])
    const results = []
    for (const i in fns) {
      const fn = fns[i]
      const scope = this.app[fn.src ?? 'main'] ?? this
      if (fn.noWait) fn.handler.call(scope, ...args)
      else {
        const res = await fn.handler.call(scope, ...args)
        results.push({
          hook: hookName,
          resp: res
        })
      }
    }
    return results
  }

  /**
   * Get download directory. If doesn't exist, it will be created automatically.
   *
   * @method
   * @returns {string} Absolute path to the download directory
   */
  getDownloadDir = () => {
    const dir = `${this.app.getPluginDataDir(this.ns)}/download`
    fs.ensureDirSync(dir)
    return dir
  }

  /**
   * Save item as file in Bajo's download directory. That is a directory inside your
   * Bajo plugin's data directory.
   *
   * If file exists already, file will automatically be
   * renamed incrementally.
   *
   * @method
   * @async
   * @param {string} file - File name.
   * @param {Object} item - Item to save.
   * @param {boolean} [printSaved=true] - Print info on screen.
   * @returns {string} Full file path.
   */
  saveAsDownload = async (file, item, printSaved = true) => {
    const fname = increment(`${this.getDownloadDir()}/${trim(file, '/')}`, { fs: true })
    await fs.writeFile(fname, item, 'utf8')
    if (printSaved) this.print.succeed('savedAs%s', path.resolve(fname), { skipSilence: true })
    return fname
  }

  /**
   * Parse `input` using all registered config handlers. The first handler that returns a
   * valid object or array will be used.
   *
   * Use this method if you want to parse a text `input` that can be in any format supported by the registered config handlers.
   *
   * @method
   * @param {string} input - The input string to be processed by the config handlers.
   * @param {string[]} [exts] - Optional array of extensions to filter the config handlers. If provided, only handlers with matching extensions will be used.
   * @param {object} [options={}] - Options to be passed to the config handlers.
   * @returns {Object|Array|null} The result from the first successful config handler, or null if none succeed.
   */
  parseConfig = async (input, exts, options = {}) => {
    let result
    options.readFromFile = false
    const handlers = exts ? this.app.configHandlers.filter(h => exts.includes(h.ext)) : this.app.configHandlers
    for (const handler of handlers) {
      if (result) break
      try {
        const resp = await handler.readHandler.call(this.app[handler.ns], input, options)
        if (!isEmpty(resp) && (isPlainObject(resp) || isArray(resp))) result = resp
      } catch (err) {
      }
    }
    return result ?? options.defValue ?? {}
  }
}

export default Bajo
