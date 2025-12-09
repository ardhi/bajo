import Plugin from './plugin.js'
import increment from 'add-filename-increment'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import ms from 'ms'
import dotenvParseVariables from 'dotenv-parse-variables'
import emptyDir from 'empty-dir'
import lodash from 'lodash'
import currentLoc from '../lib/current-loc.js'
import { createRequire } from 'module'
import getGlobalPath from 'get-global-path'
import { customAlphabet } from 'nanoid'
import fastGlob from 'fast-glob'
import querystring from 'querystring'
import deepFreeze from 'deep-freeze-strict'
import resolvePath from '../lib/resolve-path.js'
import importModule from '../lib/import-module.js'
import logLevels from '../lib/log-levels.js'
import { types as formatTypes, formats } from '../lib/formats.js'
import {
  buildBaseConfig,
  buildExtConfig,
  buildPlugins,
  collectConfigHandlers,
  bootOrder,
  bootPlugins,
  exitHandler
} from './helper/bajo.js'

const require = createRequire(import.meta.url)

const {
  isFunction, map, isObject,
  trim, filter, isEmpty, orderBy, pullAt, find, camelCase, isNumber,
  cloneDeep, isPlainObject, isArray, isString, set, omit, keys, indexOf,
  last, get, has, values, dropRight, pick
} = lodash

/**
 * The Core. The main engine. The one and only plugin that control app's boot process and
 * making sure all other plugins working nicely.
 *
 * @class
 */
class Bajo extends Plugin {
  static alias = 'bajo'
  /**
   * @param {App} app - App instance. Usefull to call app method inside a plugin
   */
  constructor (app) {
    super('bajo', app)
    this.whiteSpace = [' ', '\t', '\n', '\r']
    /**
     * Config object
     *
     * @type {Object}
     * @see {@tutorial config}
     */
    this.config = {}

    app.configHandlers = [
      { ext: '.js', readHandler: this._defConfigHandler },
      { ext: '.json', readHandler: this.fromJson, writeHandler: this.toJson }
    ]
  }

  async _defConfigHandler (file, opts = {}) {
    let mod = await importModule(file)
    if (isFunction(mod)) mod = await mod.call(this, opts)
    return mod
  }

  /**
   * Initialization:
   *
   * 1. Building {@link module:Helper/Bajo.buildBaseConfig|base config}
   * 2. {@link module:Helper/Bajo.buildPlugins|Building plugins}
   * 3. Collect all {@link module:Helper/Bajo.collectConfigHandlers|config handler}
   * 4. Building {@link module:Helper/Bajo.buildExtConfig|extra config}
   * 5. Setup {@link module:Helper/Bajo.bootOrder|boot order}
   * 6. {@link module:Helper/Bajo.bootPlugins|Boot loaded plugins}
   * 7. Attach {@link module:Helper/Bajo.exitHandler|exit handlers}
   *
   * @method
   * @async
   */
  init = async () => {
    await buildBaseConfig.call(this)
    await collectConfigHandlers.call(this)
    await buildExtConfig.call(this)
    await buildPlugins.call(this)
    await bootOrder.call(this)
    await bootPlugins.call(this)
    await exitHandler.call(this)
  }

  /**
   * Resolve file name to filesystem's path. Windows path separator ```\```
   * is normalized to Unix's ```/```
   *
   * @method
   * @param {string} file - File to resolve
   * @param {boolean} [asFileUrl=false] - Return as file URL format ```file:///<name>```
   * @returns {string}
   */
  resolvePath = (file, asFileUrl) => {
    return resolvePath(file, asFileUrl)
  }

  /**
   * Freeze object
   *
   * @method
   * @param {Object} obj - Object to freeze
   * @param {boolean} [shallow=false] - If ```false``` (default), deep freeze object
   */
  freeze = (obj, shallow = false) => {
    if (shallow) Object.freeze(obj)
    else deepFreeze(obj)
  }

  setImmediate = async () => {
    return new Promise((resolve) => {
      setImmediate(() => resolve())
    })
  }

  breakNsPathFromFile = ({ file, dir, baseNs, suffix = '', getType } = {}) => {
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
      name = baseNs
    }
    _path = camelCase(_path)
    const names = map(name.split('.'), n => camelCase(n))
    const [ns, subNs] = names
    return { ns, subNs, path: _path, fullNs: names.join('.'), type }
  }

  /**
   * Name based ```{ns}:{path}``` format
   * @typedef {string} TNsPathPairs
   * @see TNsPathResult
   * @see Bajo#buildNsPath
   * @see Bajo#breakNsPath
   */

  /**
   * Build ns/path pairs
   *
   * @method
   * @param {object} [options={}] - Options object
   * @param {string} [options.ns=''] - Namespace
   * @param {string} [options.subNs] - Sub namespace
   * @param {string} [options.subSubNs] - Sub sub namespace
   * @param {string} [options.path] - Path
   * @returns {TNsPathPairs} - Ns/path pairs
   */
  buildNsPath = ({ ns = '', subNs, subSubNs, path } = {}) => {
    if (subNs) ns += '.' + subNs
    if (subSubNs) ns += '.' + subSubNs
    return `${ns}:${path}`
  }

  /**
   * Object returned by {@link Bajo#breakNsPath|bajo:breakNsPath}
   *
   * @typedef {Object} TNsPathResult
   * @property {string} ns - Namespace
   * @property {string} [subNs] - Sub namespace
   * @property {string} [subSubNs] - Sub of sub namespace
   * @property {string} path - Path without query string or hash
   * @property {string} fullPath - Full path, including query string and hash
   * @see TNsPathPairs
   * @see Bajo#buildNsPath
   * @see Bajo#breakNsPath
   */

  /**
   * Break name to its namespace & path infos
   *
   * @method
   * @param {(TNsPathPairs|string)} name - Name to break
   * @param {boolean} [checkNs=true] - If ```true``` (default), namespace will be checked for its validity
   * @returns {TNsPathResult}
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
        const plugin = this.getPlugin(ns)
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
      if (part[0] !== ':' || part.indexOf('|') === -1) {
        realParts.push(part)
        continue
      }
      const [key, val] = part.split('|')
      parts[idx] = key
      params[key.slice(1)] = val
      realParts.push(val)
    }
    path = parts.join('/')
    const realPath = realParts.join('/')
    let fullPath = path
    if (!isEmpty(qs)) fullPath += ('?' + querystring.stringify(qs, null, null, { encodeURIComponent: (text) => (text) }))
    let realFullPath = realPath
    if (!isEmpty(qs)) realFullPath += ('?' + querystring.stringify(qs, null, null, { encodeURIComponent: (text) => (text) }))
    return { ns, path, subNs, subSubNs, qs, fullPath, fullNs, realPath, realFullPath }
  }

  /**
   * Method to transform config's array or object into an array of collection.
   *
   * @method
   * @async
   * @param {Object} options - Options
   * @param {string} [options.ns] - Namespace. If not provided, defaults to ```bajo```
   * @param {function} [options.handler] - Handler to call while building the collection item
   * @param {string[]} [options.dupChecks=[]] - Array of keys to check for duplicates
   * @param {string} options.container - Key used as container name
   * @param {boolean} [options.useDefaultName=true] - If true (default) and ```name``` key is not provided, returned collection will be named ```default```
   * @fires bajo:beforeBuildCollection
   * @fires bajo:afterBuildCollection
   * @returns {Object[]} The collection
   */
  buildCollections = async (options = {}) => {
    let { ns, handler, dupChecks = [], container, useDefaultName } = options
    useDefaultName = useDefaultName ?? true
    if (!ns) ns = this.ns
    const cfg = this.app[ns].getConfig()
    let items = get(cfg, container, [])
    if (!isArray(items)) items = [items]
    this.app[ns].log.trace('collecting%s', this.t(container))

    /**
     * Run before collection is built
     *
     * @global
     * @event bajo:beforeBuildCollection
     * @param {string} container
     * @see {@tutorial hook}
     * @see Bajo#buildCollections
     */
    await this.runHook(`${ns}:beforeBuildCollection`, container)
    const deleted = []
    for (const index in items) {
      const item = items[index]
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

    /**
     * Run after collection is built
     *
     * @global
     * @event bajo:afterBuildCollection
     * @param {string} container
     * @param {Object[]} items
     * @see {@tutorial hook}
     * @see Bajo#buildCollections
     */
    await this.runHook(`${ns}:afterBuildCollection`, container, items)
    this.app[ns].log.debug('collected%s%d', this.t(container), items.length)
    return items
  }

  /**
   * Calling any plugin's method by its name:
   *
   * - If name is a string, the corresponding plugin's method will be called with passed args as its parameters
   * - If name is a plugin instance, this will be used as the scope instead. The first args is now the handler name and the rest are its parameters
   * - If name is a function, this function will be run under scope with the remaining args
   * - If name is an object and has ```handler``` key in it, this function handler will be instead
   *
   * @method
   * @async
   * @param {(TNsPathPairs|Object|function)} name - Method's name, function handler, plain object or plugin instance
   * @param  {...any} [args] - One or more arguments passed as parameter to the handler
   * @returns {any} Returned value
   */
  callHandler = async (item, ...args) => {
    let result
    let scope = this
    if (item instanceof Plugin) {
      scope = item
      item = args.shift()
    }
    const bajo = scope.app.bajo
    if (isString(item)) {
      if (item.startsWith('applet:') && bajo.app.applets.length > 0) {
        const [, ns, path] = item.split(':')
        const applet = find(bajo.app.applets, a => (a.ns === ns || a.alias === ns))
        if (applet && scope.app.bajoCli) result = await scope.app.bajoCli.runApplet(applet, path, ...args)
      } else {
        const [ns, method, ...params] = item.split(':')
        const fn = bajo.getMethod(`${ns}:${method}`)
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
   * - ```file```: file matched the glob pattern
   * - ```dir```: plugin's base directory
   *
   * @method
   * @async
   * @param {function} handler - Function handler. Can be an async function. Scoped to the running plugin
   * @param {(string|Object)} [options={}] - Options. If a string is provided, it serves as the glob pattern, otherwise:
   * @param {(string|string[])} [options.glob] - Glob pattern. If provided,
   * @param {boolean} [options.useBajo=false] - If true, add ```bajo``` to the running plugins too
   * @param {string} [options.prefix=''] - Prepend glob pattern with prefix
   * @param {boolean} [options.noUnderscore=true] - If true (default), matched file with name starts with underscore is ignored
   * @param {any} [options.returnItems] - If true, each value of returned handler call will be saved as an object with running plugin name as its keys
   * @returns {any}
   */
  eachPlugins = async (handler, options = {}) => {
    if (typeof options === 'string') options = { glob: options }
    const result = {}
    const pluginPkgs = cloneDeep(this.app.pluginPkgs) ?? []
    const { glob, useBajo, prefix = '', noUnderscore = true, returnItems } = options
    if (useBajo) pluginPkgs.unshift('bajo')
    for (const pkgName of pluginPkgs) {
      const ns = camelCase(pkgName)
      let r
      if (glob) {
        const base = prefix === '' ? `${this.app[ns].dir.pkg}/extend` : `${this.app[ns].dir.pkg}/extend/${prefix}`
        let opts = isString(glob) ? { pattern: [glob] } : glob
        let pattern = opts.pattern ?? []
        if (isString(pattern)) pattern = [pattern]
        opts = omit(opts, ['pattern'])
        for (const i in pattern) {
          if (!path.isAbsolute(pattern[i])) pattern[i] = `${base}/${pattern[i]}`
        }
        const files = await fastGlob(pattern, opts)
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
   * Object returned by {@link Bajo#getUnitFormat|bajo:getUnitFormat}
   *
   * @typedef {Object} TBajoFormatResult
   * @property {string} unitSys - Unit system
   * @property {Object} format - Format object
   * @see Bajo#getUnitFormat
   */

  /**
   * Get unit format
   *
   * @method
   * @param {Object} [options={}] - Options
   * @param {string} [options.lang] - Language to use. Defaults to the one you set in config
   * @param {string} [options.unitSys] - Unit system to use. Defaults to language's unit system or ```metric``` if unspecified
   * @returns {TBajoFormatResult} - Returned value
   */
  getUnitFormat = (options = {}) => {
    const lang = options.lang ?? this.config.lang
    let unitSys = options.unitSys ?? this.config.intl.unitSys[lang] ?? 'metric'
    if (!['imperial', 'nautical', 'metric'].includes(unitSys)) unitSys = 'metric'
    return { unitSys, format: formats[unitSys] }
  }

  /**
   * Format value by type
   *
   * @method
   * @param {string} type - Format type. See {@link TBajoFormatType} for acceptable values
   * @param {any} value - Value to format
   * @param {string} [dataType] - Value's data type. See {@link TBajoDataType} for acceptable values
   * @param {Object} [options={}] - Options
   * @param {boolean} [options.withUnit=true] - Return with its unit appended
   * @param {string} [options.lang] - Format value according to this language. Defaults to the one you set in config
   * @returns {(Array|string)} Return string if ```withUnit``` is true. Otherwise is an array of ```[value, unit, separator]```
   */
  formatByType = (type, value, dataType, options = {}) => {
    const { defaultsDeep } = this.app.lib.aneka
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
   * Format value
   *
   * @method
   * @param {any} value - Value to format
   * @param {string} [type] - Data type to use. See {@link TBajoDataType} for acceptable values. If not provided, return the untouched value
   * @param {Object} [options={}] - Options
   * @param {string} [options.emptyValue=''] - Empty value to use if function resulted empty. Defaults to the one from your config
   * @param {boolean} [options.withUnit=true] - Return with its unit appended
   * @param {string} [options.lang] - Format value according to this language. Defaults to the one you set in config
   * @param {string} [options.latitude] - If Bajo Spatial is loaded and data type is a double or float, then format it as latitude in degree, minute, second
   * @param {string} [options.longitude] - If Bajo Spatial is loaded and data type is a double or float, then format it as longitude in degree, minute, second
   * @returns {string} Formatted value
   */
  format = (value, type, options = {}) => {
    const { defaultsDeep } = this.app.lib.aneka
    const { format } = this.config.intl
    const { emptyValue = format.emptyValue } = options
    const lang = options.lang ?? this.config.lang
    options.withUnit = options.withUnit ?? true
    let valueFormatted
    if ([undefined, null, ''].includes(value)) return emptyValue
    if (type === 'auto') {
      if (value instanceof Date) type = 'datetime'
    }
    if (['float', 'double'].includes(type) && this.app.bajoSpatial) {
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
    return value
  }

  /**
   * Generate unique random characters that can be used as ID. Use {@link https://github.com/ai/nanoid|nanoid} under the hood
   *
   * @method
   * @param {(boolean|string|Object)} [options={}] - Options. If set to ```true``` or ```alpha```, it will generate alphaphet only characters. If set to ```int```, it will generate integer only characters. Otherwise:
   * @param {string} [options.pattern] - Character pattern to use. Defaults to all available alphanumeric characters
   * @param {number} [options.length=13] - Length of resulted characters
   * @param {string} [options.case] - If set to ```lower``` to use lower cased pattern only. For upper cased pattern, set it to ```upper```
   * @param {boolean} [options.returnInstance] - Set to ```true``` to return {@link https://github.com/ai/nanoid|nanoid} instance instead of string
   * @returns {(string|Object)} Return string or instance of {@link https://github.com/ai/nanoid|nanoid}
   */
  generateId = (options = {}) => {
    let type
    if (options === true) options = 'alpha'
    if (options === 'int') {
      type = options
      options = { pattern: '0123456789', length: 15 }
    } else if (options === 'alpha') {
      type = options
      options = { pattern: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ', length: 15 }
    }
    let { pattern, length = 13, returnInstance } = options
    pattern = pattern ?? 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    if (options.case === 'lower') pattern = pattern.toLowerCase()
    else if (options.case === 'upper') pattern = pattern.toUpperCase()
    const nid = customAlphabet(pattern, length)
    if (returnInstance) return nid
    const value = nid()
    return type === 'int' ? parseInt(value) : value
  }

  /**
   * Get NPM global module directory
   *
   * @method
   * @param {string} [pkgName] - If provided, return this package global directory. Otherwise the npm global module directory
   * @param {boolean} [silent=true] - Set to ```false``` to throw exception in case of error. Otherwise silently returns undefined
   * @returns {string}
   */
  getGlobalModuleDir = (pkgName, silent = true) => {
    let nodeModulesDir = process.env.BAJO_GLOBAL_MODULE_DIR
    if (!nodeModulesDir) {
      const npmPath = getGlobalPath('npm')
      if (!npmPath) {
        if (silent) return
        throw this.error('cantLocateNpmGlobalDir', { code: 'BAJO_CANT_LOCATE_NPM_GLOBAL_DIR' })
      }
      nodeModulesDir = dropRight(resolvePath(npmPath).split('/'), 1).join('/')
      process.env.BAJO_GLOBAL_MODULE_DIR = nodeModulesDir
    }
    if (!pkgName) return nodeModulesDir
    const dir = `${nodeModulesDir}/${pkgName}`
    if (!fs.existsSync(dir)) {
      if (silent) return
      throw this.error('cantLocateGlobalDir%s', pkgName, { code: 'BAJO_CANT_LOCATE_MODULE_GLOBAL_DIR' })
    }
    return dir
  }

  /**
   * Get class method by name
   *
   * @method
   * @param {string} name - Name in format ```ns:methodName```
   * @param {boolean} [thrown=true] - If ```true``` (default), throw exceptiom in case of error
   * @returns {function} Class method
   */
  getMethod = (name = '', thrown = true) => {
    const { ns, path } = this.breakNsPath(name)
    const method = get(this.app, `${ns}.${path}`)
    if (method && isFunction(method)) return method
    if (thrown) throw this.error('cantFindMethod%s', name)
  }

  /**
   * Find item deep in paths
   *
   * @method
   * @param {string} item - Item to find
   * @param {Array} paths - Array of path to look for
   * @returns {string}
   */
  findDeep = (item, paths) => {
    let dir
    for (const p of paths) {
      const d = `${p}/${item}`
      if (fs.existsSync(d)) {
        dir = d
        break
      }
    }
    return dir
  }

  /**
   * Get module directory, locally and globally
   *
   * @method
   * @param {string} pkgName - Package name to find
   * @param {string} base - Provide base name if ```pkgName``` is a module under ```base```'s package name
   * @returns {string} Return absolute package directory
   */
  getModuleDir = (pkgName, base) => {
    if (pkgName === 'main') return resolvePath(this.app.dir)
    if (base === 'main') base = this.app.dir
    else if (this && this.app && this.app[base]) base = this.app[base].pkgName
    const pkgPath = pkgName + '/package.json'
    const paths = require.resolve.paths(pkgPath)
    const gdir = this.getGlobalModuleDir()
    paths.unshift(gdir)
    paths.unshift(resolvePath(path.join(this.app.dir, 'node_modules')))
    let dir = this.findDeep(pkgPath, paths)
    if (base && !dir) dir = this.findDeep(`${base}/node_modules/${pkgPath}`, paths)
    if (!dir) return null
    return resolvePath(path.dirname(dir))
  }

  /**
   * Get plugin data directory
   *
   * @method
   * @param {string} name - Plugin name (namespace) or alias
   * @param {boolean} [ensureDir=true] - Set ```true``` (default) to ensure directory is existed
   * @returns {string}
   */
  getPluginDataDir = (name, ensureDir = true) => {
    const plugin = this.getPlugin(name)
    const dir = `${this.app.bajo.dir.data}/plugins/${plugin.ns}`
    if (ensureDir) fs.ensureDirSync(dir)
    return dir
  }

  /**
   * Resolve file path from:
   *
   * - local/absolute file
   * - TNsPath (```myPlugin:/path/to/file.txt```)
   * - file under node_modules, e.g. ```myPlugin:node_modules/some-package/file.txt```
   *
   * @method
   * @param {string} file - File path, see above for supported types
   * @returns {string} Resolved file path
   */
  getPluginFile = (file) => {
    if (!this) return file
    if (file[0] === '.') file = `${currentLoc(import.meta).dir}/${trim(file.slice(1), '/')}`
    if (file.includes(':')) {
      if (file.slice(1, 2) === ':') return file // windows fs
      const { ns, path } = this.breakNsPath(file)
      if (ns !== 'file' && this && this.app && this.app[ns] && ns.length > 1) {
        file = `${this.app[ns].dir.pkg}${path}`
        if (path.startsWith('node_modules/')) {
          if (!fs.existsSync(file)) {
            file = `${this.app[ns].dir.pkg}/../${path.slice('node_modules/'.length)}`
          }
        }
      }
    }
    return file
  }

  /**
   * Get plugin by name
   *
   * @method
   * @param {string} name - Plugin name/namespace or alias
   * @param {boolean} [silent] - If ```true```, silently return undefined even on error
   * @returns {Object} Plugin object
   */
  getPlugin = (name, silent) => {
    if (!this.app[name]) {
      // alias?
      let plugin
      for (const key in this.app) {
        const item = this.app[key]
        if (item instanceof Plugin && (item.alias === name || item.pkgName === name)) {
          plugin = item
          break
        }
      }
      if (!plugin) {
        if (silent) return false
        throw this.error('pluginWithNameAliasNotLoaded%s', name)
      }
      name = plugin.ns
    }
    return this.app[name]
  }

  /**
   * Import file/module from any loaded plugins.
   *
   * Method proxy from {@link module:Lib.importModule}
   *
   * @method
   * @async
   * @see module:Lib.importModule
   */
  importModule = async (file, { asDefaultImport, asHandler, noCache } = {}) => {
    return await importModule.call(this, file, { asDefaultImport, asHandler, noCache })
  }

  /**
   * Import one or more packages belongs to a plugin.
   *
   * If the last arguments passed is an object, this object serves as options object:
   * - ```returnDefault```: should return package's default export. Defaults to ```true```
   * - ```throwNotFound```: should throw if package is not found. Defaults to ```false```
   * - ```noCache```: always use fresh import. Defaults to ```false```
   * - ```asObject```: see below. Defaults to ```false```
   *
   * Return value:
   * - if ```options.asObject``` is ```true``` (default ```false```), return as object with package's names as it's keys
   * - Otherwise depends on how many parameters are provided, it should return the named package or an array of packages
   *
   * Example: you want to import ```delay``` and ```chalk``` from ```bajo``` plugin because you want to use it in your code
   * ```javascript
   * const { importPkg } from this.app.bajo
   * const [delay, chalk] = await importPkg('bajo:delay', 'bajo:chalk')
   *
   * await delay(1000)
   * ...
   * ```
   *
   * @method
   * @async
   * @param {...TNsPathPairs} pkgs - One or more packages in format ```{ns}:{packageName}```
   * @returns {(Object|Array)} See above
   */
  importPkg = async (...pkgs) => {
    const { defaultsDeep } = this.app.lib.aneka
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
      const p = this.readJson(`${dir}/package.json`, opts.throwNotFound)
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
    if (notFound.length > 0) throw this.error('cantFind%s', this.join(notFound))
    if (opts.asObject) return result
    if (pkgs.length === 1) return result[keys(result)[0]]
    return values(result)
  }

  /**
   * Check whether a directory is empty or not. More info please {@link https://github.com/gulpjs/empty-dir|check here}.
   *
   * @method
   * @async
   * @param {(string|TNsPathPairs)} dir - Directory to check
   * @param {function} filterFn - Filter function to filter out files that cause false positives.
   * @returns {boolean}
   */
  isEmptyDir = async (dir, filterFn) => {
    dir = resolvePath(this.getPluginFile(dir))
    await fs.exists(dir)
    return await emptyDir(dir, filterFn)
  }

  /**
   * Check whether log level is within log's app current level
   *
   * @method
   * @param {string} level - Level to check. See {@link TLogLevels} for more
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
   * Check whether directory is a valid Bajo app
   *
   * @method
   * @param {string} dir - Directory to check
   * @param {boolean} [returnPkg] - Set ```true``` to return its package.json content
   * @returns {(boolean|Object)}
   */
  isValidApp = (dir, returnPkg) => {
    if (!dir) dir = this.app.dir
    return this.isValidAppPlugin(dir, 'app', returnPkg)
  }

  /**
   * Check whether directory is a valid Bajo plugin
   *
   * @method
   * @param {string} dir - Directory to check
   * @param {boolean} [returnPkg] - Set ```true``` to return its package.json content
   * @returns {(boolean|Object)}
   */
  isValidPlugin = (dir, returnPkg) => {
    if (!dir) dir = this.app.dir
    return this.isValidAppPlugin(dir, 'plugin', returnPkg)
  }

  /**
   * Human friendly join array of items.
   *
   * @method
   * @param {any[]} array - Array to join
   * @param {(string|Object)} options - If provided and is a string, it will be used as separator
   * @param {string} [options.separator=', '] - Separator to use
   * @param {string} [options.lastSeparator=and] - Text to use as the last separator
   * @returns {string}
   */
  join = (array, options) => {
    const { isSet } = this.app.lib.aneka
    const translate = val => {
      return this.t(val).toLowerCase()
    }
    if (array.length === 0) return translate('none')
    if (array.length === 1) return array[0]
    if (isSet(options) && !isPlainObject(options)) return array.join(options)
    let { separator = ', ', lastSeparator = 'and' } = options ?? {}
    lastSeparator = translate(lastSeparator)
    const last = (array.pop() ?? '').trim()
    return array.map(a => (a + '').trim()).join(separator) + ` ${lastSeparator} ${last}`
  }

  /**
   * Return its numeric portion of a value
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
   * Parse duration to its millisecond value. Use {@link https://github.com/vercel/ms|ms} under the hood
   *
   * @method
   * @param {(number|string)} dur - If string is given, parse this to its millisecond value. Otherwise returns as is
   * @returns {number}
   * @see {@link https://github.com/vercel/ms|ms}
   */
  parseDur = (dur) => {
    return isNumber(dur) ? dur : ms(dur)
  }

  /**
   * Parse datetime string as Javascript date object. Please visit {@link https://day.js.org|dayjs} for valid formats and more infos
   *
   * @method
   * @param {string} dt - Datetime string
   * @returns {Object} Javascript date object
   * @see {@link https://day.js.org|dayjs}
   */
  parseDt = (dt) => {
    const value = this.app.lib.dayjs(dt)
    if (!value.isValid()) throw this.error('dtUnparsable%s', dt)
    return value.toDate()
  }

  /**
   * Parse an object and optionally normalize its values recursively. Use {@link https://github.com/ladjs/dotenv-parse-variables}
   * to parse values, so please have a visit to know how it works
   *
   * If ```options.parseValue``` is ```true```, any key ends with ```Dur``` and ```Dt``` will
   * also be parsed as millisecond and Javascript date time accordingly.
   *
   * @method
   * @param {(Object|string)} input - If string is given, parse it first using JSON.parse
   * @param {Object} [options={}] - Options
   * @param {boolean} [options.silent=true] - If ```true``` (default), exception are not thrown and silently ignored
   * @param {boolean} [options.parseValue=false] - If ```true```, values will be parsed & normalized
   * @param {string} [options.lang] - If provided, use this language instead of the one in config
   * @returns {Object}
   * @see {@link https://github.com/ladjs/dotenv-parse-variables}
   */
  parseObject = (input, options = {}) => {
    const { silent = true, parseValue = false, lang, ns } = options
    const { isSet } = this.app.lib.aneka
    const translate = (item) => {
      const scope = ns ? this.app[ns] : this
      const [text, ...args] = item.split('|')
      return scope.t(text, ...args, { lang })
    }
    const statics = ['*']
    if (isString(input)) {
      try {
        input = JSON.parse(input)
      } catch (err) {
        if (silent) input = {}
        else throw err
      }
    }
    let obj = cloneDeep(input)
    const keys = Object.keys(obj)
    const mutated = []
    keys.forEach(k => {
      let v = obj[k]
      if (isPlainObject(v)) obj[k] = this.parseObject(v, options)
      else if (isArray(v)) {
        v.forEach((i, idx) => {
          if (isPlainObject(i)) obj[k][idx] = this.parseObject(i, options)
          else if (statics.includes(i)) obj[k][idx] = i
          else if (parseValue) obj[k][idx] = dotenvParseVariables(set({}, 'item', obj[k][idx]), { assignToProcessEnv: false }).item
          if (isArray(obj[k][idx])) obj[k][idx] = obj[k][idx].map(item => typeof item === 'string' ? item.trim() : item)
        })
      } else if (isSet(v)) {
        if (isString(v) && v.startsWith('t:') && lang) v = translate(v.slice(2))
        try {
          if (statics.includes(v)) obj[k] = v
          else if (k.startsWith('t:') && isString(v)) {
            const newK = k.slice(2)
            if (lang) obj[newK] = translate(v)
            else obj[newK] = v
            mutated.push(k)
          } else if (parseValue) {
            obj[k] = dotenvParseVariables(set({}, 'item', v), { assignToProcessEnv: false }).item
            if (isArray(obj[k])) obj[k] = obj[k].map(item => typeof item === 'string' ? item.trim() : item)
          }
          if (k.slice(-3) === 'Dur') obj[k] = this.parseDur(v)
          if (k.slice(-2) === 'Dt') obj[k] = this.parseDt(v)
        } catch (err) {
          obj[k] = undefined
          if (!silent) throw err
        }
      }
    })
    if (mutated.length > 0) obj = omit(obj, mutated)
    return obj
  }

  pick = (obj, items, excludeUnset) => {
    const { isSet } = this.app.lib.aneka
    const result = {}
    for (const item of items) {
      const [k, nk] = item.split(':')
      if (excludeUnset && !isSet(obj[k])) continue
      result[nk ?? k] = obj[k]
    }
    return result
  }

  /**
   * Read and parse file as config object. Supported types: ```.js``` and ```.json```.
   * More supports can be added using plugin. {@link https://github.com/ardhi/bajo-config|bajo-config} gives you additional supports for ```.yml```, ```.yaml``` and ```.toml``` file
   *
   * If file extension is ```.*```, it will be auto detected and parsed accordingly
   *
   * @method
   * @async
   * @param {string} file - File to read and parse
   * @param {Object} [options={}] - Options
   * @param {boolean} [options.ignoreError] - Any exception will be silently discarded
   * @param {string} [options.ns] - If given, use this as the scope
   * @param {string} [options.pattern] - If given and auto detection is on (extension is ```.*```), it will be used for instead the default one
   * @param {Object} [options.globOptions={}] - {@link https://github.com/mrmlnc/fast-glob|fast-glob} options
   * @param {Object} [options.defValue={}] - Default value to use if value returned empty
   * @param {Object} [options.opts={}] - Parser setting
   * @returns {Object}
   */
  readConfig = async (file, { ns, pattern, globOptions = {}, ignoreError, defValue = {}, opts = {} } = {}) => {
    if (!ns) ns = this.ns
    file = resolvePath(this.getPluginFile(file))
    let ext = path.extname(file)
    const fname = path.dirname(file) + '/' + path.basename(file, ext)
    ext = ext.toLowerCase()
    if (ext === '.js') {
      const { readHandler } = find(this.app.configHandlers, { ext })
      return this.parseObject(await readHandler.call(this.app[ns], file, opts))
    }
    if (ext === '.json') return await this.fromJson(file, null)
    if (!['', '.*'].includes(ext)) {
      const item = find(this.app.configHandlers, { ext })
      if (!item) {
        if (!ignoreError) throw this.error('cantParse%s', file, { code: 'BAJO_CONFIG_NO_PARSER' })
        return this.parseObject(defValue)
      }
      return this.parseObject(await item.readHandler.call(this.app[ns], file, opts))
    }
    const item = pattern ?? `${fname}.{${map(map(this.app.configHandlers, 'ext'), k => k.slice(1)).join(',')}}`
    const files = await fastGlob(item, globOptions)
    if (files.length === 0) {
      if (!ignoreError) throw this.error('noConfigFileFound', { code: 'BAJO_CONFIG_FILE_NOT_FOUND' })
      return this.parseObject(defValue)
    }
    let config = defValue
    for (const f of files) {
      const ext = path.extname(f).toLowerCase()
      const item = find(this.app.configHandlers, { ext })
      if (!item) {
        if (!ignoreError) throw this.error('cantParse%s', f, { code: 'BAJO_CONFIG_NO_PARSER' })
        continue
      }
      config = await item.readHandler.call(this.app[ns], f, null, opts)
      if (!isEmpty(config)) break
    }
    return this.parseObject(config)
  }

  /**
   * Read and parse json file
   *
   * @method
   * @param {string} file - File to read
   * @param {boolean} [thrownNotFound=false] - If ```true```, silently ignore if file is not found
   * @returns {Object}
   */
  readJson = (file, thrownNotFound = false) => {
    if (isPlainObject(thrownNotFound)) thrownNotFound = false
    if (!fs.existsSync(file) && thrownNotFound) throw this.error('notFound%s%s', this.t('file'), file)
    let resp
    try {
      resp = fs.readFileSync(file, 'utf8')
    } catch (err) {}
    if (isEmpty(resp)) return resp
    return this.parseObject(JSON.parse(resp))
  }

  fromJson (file, isContent) {
    const content = isContent ? file : fs.readFileSync(file, 'utf8')
    return JSON.parse(content)
  }

  toJson = (file, isContent, opts = 2) => {
    const content = isContent ? file : JSON.parse(fs.readFileSync(file, 'utf8'))
    return JSON.stringify(content, null, opts)
  }

  /**
   * Read all config files by path
   *
   * @method
   * @async
   * @param {string} path - Base path to start looking config files
   * @returns {Object}
   */
  readAllConfigs = async (path) => {
    const { defaultsDeep } = this.app.lib.aneka
    let cfg = {}
    let ext = {}
    // default config file
    try {
      cfg = await this.readConfig(`${path}.*`, { ignoreError: true })
    } catch (err) {
      if (['BAJO_CONFIG_NO_PARSER'].includes(err.code)) throw err
    }
    // env based config file
    try {
      ext = await this.readConfig(`${path}-${this.config.env}.*`, { ignoreError: true })
    } catch (err) {
      if (!['BAJO_CONFIG_FILE_NOT_FOUND'].includes(err.code)) throw err
    }
    return defaultsDeep({}, ext, cfg)
  }

  /**
   * Run named hook/event
   *
   * @method
   * @async
   * @param {TNsPathPairs} hookName
   * @param  {...any} [args] - Argument passed to the hook function
   * @returns {Array} Array of hook execution results
   */
  runHook = async (hookName, ...args) => {
    const [ns, path] = (hookName ?? '').split(':')
    let fns = filter(this.app.bajo.hooks, { ns, path })
    if (isEmpty(fns)) return []
    fns = orderBy(fns, ['level'])
    const results = []
    for (const i in fns) {
      const fn = fns[i]
      const scope = this.app[fn.src]
      const res = await fn.handler.call(scope, ...args)
      results.push({
        hook: hookName,
        resp: res
      })
      if (this.config.log.traceHook) scope.log.trace('hookExecuted%s', hookName)
    }
    return results
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
   * @param {string} file - File name
   * @param {Object} item - Item to save
   * @param {boolean} [printSaved=true] - Print info on screen
   * @returns {string} Full file path
   */
  saveAsDownload = async (file, item, printSaved = true) => {
    const { print, getPluginDataDir } = this.app.bajo
    const fname = increment(`${getPluginDataDir(this.ns)}/download/${trim(file, '/')}`, { fs: true })
    const dir = path.dirname(fname)
    if (!fs.existsSync(dir)) fs.ensureDirSync(dir)
    await fs.writeFile(fname, item, 'utf8')
    if (printSaved) print.succeed('savedAs%s', path.resolve(fname), { skipSilence: true })
    return fname
  }
}

export default Bajo
