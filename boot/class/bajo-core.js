import Plugin from './plugin.js'
import BajoPlugin from './bajo-plugin.js'
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

const require = createRequire(import.meta.url)

const {
  isFunction, map, isObject,
  trim, filter, isEmpty, orderBy, pullAt, find, camelCase, isNumber,
  cloneDeep, isPlainObject, isArray, isString, set, omit, keys, indexOf,
  last, get, has, values, dropRight, pick
} = lodash

class BajoCore extends Plugin {
  constructor (app) {
    super('bajo', app)
    this.runAt = new Date()
    this.mainNs = 'main'
    this.lib.BajoPlugin = BajoPlugin
    this.applets = []
    this.pluginPkgs = []
    this.pluginNames = []
    this.configHandlers = [
      { ext: '.js', readHandler: this._defConfigHandler },
      { ext: '.json', readHandler: this.readJson }
    ]
    this.whiteSpace = [' ', '\t', '\n', '\r']
    this.envs = { dev: 'development', staging: 'staging', prod: 'production' }
  }

  async _defConfigHandler (file, opts = {}) {
    let mod = await importModule(file)
    if (isFunction(mod)) mod = await mod.call(this, opts)
    return mod
  }

  resolvePath = (item, asFileUrl) => {
    return resolvePath(item, asFileUrl)
  }

  freeze = (o, shallow) => {
    if (shallow) Object.freeze(o)
    else deepFreeze(o)
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

  buildNsPath = ({ ns = '', subNs, subSubNs, path } = {}) => {
    if (subNs) ns += '.' + subNs
    if (subSubNs) ns += '.' + subSubNs
    return `${ns}:${path}`
  }

  breakNsPath = (item = '', defaultNs = 'bajo', checkNs = true) => {
    let [ns, ...path] = item.split(':')
    const fullNs = ns
    let subNs
    let subSubNs
    path = path.join(':')
    if (path.startsWith('//')) {
      return { path: item } // for: http:// etc
    }

    [ns, subNs, subSubNs] = ns.split('.')
    if (checkNs) {
      if (!this.app[ns]) {
        const plugin = this.getPlugin(ns)
        if (plugin) ns = plugin.name
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

  buildCollections = async (options = {}) => {
    let { ns, handler, dupChecks = [], container, useDefaultName } = options
    useDefaultName = useDefaultName ?? true
    if (!ns) ns = this.name
    const cfg = this.app[ns].getConfig()
    let items = get(cfg, container, [])
    if (!isArray(items)) items = [items]
    this.app[ns].log.trace('collecting%s', this.app[ns].print.write(container))
    await this.runHook(`${ns}:${camelCase('beforeBuildCollection')}`, container)
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
      if (this.app.bajo.applet && item.skipOnTool && !deleted.includes(index)) deleted.push(index)
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
    await this.runHook(`${ns}:${camelCase('afterBuildCollection')}`, container)
    this.app[ns].log.debug('collected%s%d', this.app[ns].print.write(container), items.length)
    return items
  }

  callHandler = async (item, ...args) => {
    let result
    let scope = this
    if (item instanceof BajoPlugin) {
      scope = item
      item = args.shift()
    }
    const bajo = scope.app.bajo
    if (isString(item)) {
      if (item.startsWith('applet:') && bajo.applets.length > 0) {
        const [, ns, path] = item.split(':')
        const applet = find(bajo.applets, a => (a.ns === ns || a.alias === ns))
        if (applet) result = await bajo.runApplet(applet, path, ...args)
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
    } else if (isPlainObject(item) && item.handler) {
      result = await item.handler.call(scope, ...args)
    }
    return result
  }

  eachPlugins = async (handler, options = {}) => {
    if (typeof options === 'string') options = { glob: options }
    const result = {}
    const pluginPkgs = cloneDeep(this.app.bajo.pluginPkgs) ?? []
    const { glob, useBajo, prefix = '', noUnderscore = true, returnItems } = options
    if (useBajo) pluginPkgs.unshift('bajo')
    for (const pkgName of pluginPkgs) {
      const ns = camelCase(pkgName)
      const config = this.app[ns].config
      const alias = this.app[ns].alias
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
          const resp = await handler.call(this.app[ns], { ns, pkgName, config, alias, file: f, dir: base })
          if (resp === false) break
          else if (resp === undefined) continue
          else {
            result[ns] = result[ns] ?? {}
            result[ns][f] = resp
          }
        }
      } else {
        r = await handler.call(this.app[ns], { ns, pkgName, config, dir: this.app[ns].dir.pkg, alias })
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

  getUnitFormat = (options = {}) => {
    const lang = options.lang ?? this.config.lang
    let unitSys = options.unitSys ?? this.config.intl.unitSys[lang] ?? 'metric'
    if (!['imperial', 'nautical', 'metric'].includes(unitSys)) unitSys = 'metric'
    return { unitSys, format: formats[unitSys] }
  }

  formatByType = (type, value, dataType, options = {}) => {
    const { defaultsDeep } = this.lib.aneka
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

  format = (value, type, options = {}) => {
    const { defaultsDeep } = this.lib.aneka
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
      const { latToDms, lngToDms } = this.app.bajoSpatial.lib.anekaSpatial
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

  getMethod = (name = '', thrown = true) => {
    const { ns, path } = this.breakNsPath(name)
    const method = get(this.app, `${ns}.${path}`)
    if (method && isFunction(method)) return method
    if (thrown) throw this.error('cantFindMethod%s', name)
  }

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

  getPluginDataDir = (name, ensureDir = true) => {
    const plugin = this.getPlugin(name)
    const dir = `${this.app.bajo.dir.data}/plugins/${plugin.name}`
    if (ensureDir) fs.ensureDirSync(dir)
    return dir
  }

  getPluginFile = (file) => {
    if (!this) return file
    if (file[0] === '.') file = `${currentLoc(import.meta).dir}/${trim(file.slice(1), '/')}`
    if (file.includes(':')) {
      if (file.slice(1, 2) === ':') return file // windows fs
      const { ns, path } = this.breakNsPath(file)
      if (ns !== 'file' && this && this.app && this.app[ns] && ns.length > 1) {
        file = `${this.app[ns].dir.pkg}${path}`
      }
    }
    return file
  }

  getPlugin = (name, silent) => {
    if (!this.app[name]) {
      // alias?
      let plugin
      for (const key in this.app) {
        const item = this.app[key]
        if (item instanceof BajoPlugin && (item.alias === name || item.pkgName === name)) {
          plugin = item
          break
        }
      }
      if (!plugin) {
        if (silent) return false
        throw this.error('pluginWithNameAliasNotLoaded%s', name)
      }
      name = plugin.name
    }
    return this.app[name]
  }

  importModule = async (file, { asDefaultImport, asHandler, noCache } = {}) => {
    return await importModule.call(this, file, { asDefaultImport, asHandler, noCache })
  }

  importPkg = async (...pkgs) => {
    const { defaultsDeep } = this.lib.aneka
    const result = {}
    const notFound = []
    let opts = { returnDefault: true, thrownNotFound: false }
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
      const p = this.readJson(`${dir}/package.json`, opts.thrownNotFound)
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
    if (pkgs.length === 1) return result[keys(result)[0]]
    if (opts.asObject) return result
    return values(result)
  }

  isEmptyDir = async (dir) => {
    await fs.exists(dir)
    return await emptyDir(dir)
  }

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

  isValidApp = (dir, returnPkg) => {
    if (!dir) dir = this.app.dir
    return this.isValidAppPlugin(dir, 'app', returnPkg)
  }

  isValidPlugin = (dir, returnPkg) => {
    if (!dir) dir = this.app.dir
    return this.isValidAppPlugin(dir, 'plugin', returnPkg)
  }

  join = (array, sep) => {
    const { isSet } = this.lib.aneka
    const translate = val => {
      if (this && this.print) return this.print.write(val).toLowerCase()
      return val
    }
    if (array.length === 0) return translate('none')
    if (array.length === 1) return array[0]
    if (isSet(sep) && !isPlainObject(sep)) return array.join(sep)
    let { separator = ', ', joiner = 'and' } = sep ?? {}
    joiner = translate(joiner)
    const last = (array.pop() ?? '').trim()
    return array.map(a => (a + '').trim()).join(separator) + ` ${joiner} ${last}`
  }

  numUnit = (value = '', defUnit = '') => {
    const num = value.match(/\d+/g)
    const unit = value.match(/[a-zA-Z]+/g)
    return `${num[0]}${isEmpty(unit) ? defUnit : unit[0]}`
  }

  parseDur = (val) => {
    return isNumber(val) ? val : ms(val)
  }

  parseDt = (val) => {
    const dt = this.lib.dayjs(val)
    if (!dt.isValid()) throw this.error('dtUnparsable%s', val)
    return dt.toDate()
  }

  parseObject = (input, options = {}) => {
    const { silent = true, parseValue = false, lang, ns } = options
    const { isSet } = this.lib.aneka
    const translate = (item) => {
      const scope = ns ? this.app[ns] : this
      const [text, ...args] = item.split('|')
      return scope.print.write(text, ...args, { lang })
    }
    const statics = ['*']
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
    const { isSet } = this.lib.aneka
    const result = {}
    for (const item of items) {
      const [k, nk] = item.split(':')
      if (excludeUnset && !isSet(obj[k])) continue
      result[nk ?? k] = obj[k]
    }
    return result
  }

  readConfig = async (file, { ns, pattern, globOptions = {}, ignoreError, defValue = {}, opts = {} } = {}) => {
    if (!ns) ns = this.name
    file = resolvePath(this.getPluginFile(file))
    let ext = path.extname(file)
    const fname = path.dirname(file) + '/' + path.basename(file, ext)
    ext = ext.toLowerCase()
    if (['.mjs', '.js'].includes(ext)) {
      const { readHandler } = find(this.app.bajo.configHandlers, { ext })
      return this.parseObject(await readHandler.call(this.app[ns], file, opts))
    }
    if (ext === '.json') return await this.readJson(file)
    if (!['', '.*'].includes(ext)) {
      const item = find(this.app.bajo.configHandlers, { ext })
      if (!item) {
        if (!ignoreError) throw this.error('cantParse%s', file, { code: 'BAJO_CONFIG_NO_PARSER' })
        return this.parseObject(defValue)
      }
      return this.parseObject(await item.readHandler.call(this.app[ns], file, opts))
    }
    const item = pattern ?? `${fname}.{${map(map(this.app.bajo.configHandlers, 'ext'), k => k.slice(1)).join(',')}}`
    const files = await fastGlob(item, globOptions)
    if (files.length === 0) {
      if (!ignoreError) throw this.error('noConfigFileFound', { code: 'BAJO_CONFIG_FILE_NOT_FOUND' })
      return this.parseObject(defValue)
    }
    let config = defValue
    for (const f of files) {
      const ext = path.extname(f).toLowerCase()
      const item = find(this.app.bajo.configHandlers, { ext })
      if (!item) {
        if (!ignoreError) throw this.error('cantParse%s', f, { code: 'BAJO_CONFIG_NO_PARSER' })
        continue
      }
      config = await item.readHandler.call(this.app[ns], f, opts)
      if (!isEmpty(config)) break
    }
    return this.parseObject(config)
  }

  readJson = (file, thrownNotFound = false) => {
    if (isPlainObject(thrownNotFound)) thrownNotFound = false
    if (!fs.existsSync(file) && thrownNotFound) throw this.error('notFound%s%s', this.print.write('file'), file)
    let resp
    try {
      resp = fs.readFileSync(file, 'utf8')
    } catch (err) {}
    if (isEmpty(resp)) return resp
    return this.parseObject(JSON.parse(resp))
  }

  runHook = async (hookName, ...args) => {
    const [ns, path] = (hookName ?? '').split(':')
    let fns = filter(this.app.bajo.hooks, { ns, path })
    if (isEmpty(fns)) return
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

  saveAsDownload = async (file, obj, printSaved = true) => {
    const { print, getPluginDataDir } = this.app.bajo
    const fname = increment(`${getPluginDataDir(this.name)}/${trim(file, '/')}`, { fs: true })
    const dir = path.dirname(fname)
    if (!fs.existsSync(dir)) fs.ensureDirSync(dir)
    await fs.writeFile(fname, obj, 'utf8')
    if (printSaved) print.succeed('savedAs%s', path.resolve(fname), { skipSilence: true })
    return fname
  }
}

export default BajoCore
