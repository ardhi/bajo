import Plugin from './plugin.js'
import BajoPlugin from './bajo-plugin.js'
import dayjs from '../lib/dayjs.js'
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
import { sprintf } from 'sprintf-js'
import outmatch from 'outmatch'
import resolvePath from '../lib/resolve-path.js'
import importModule from '../lib/import-module.js'
import logLevels from '../lib/log-levels.js'

const require = createRequire(import.meta.url)

const {
  isFunction, words, upperFirst, map, concat, uniq, forOwn, padStart,
  trim, filter, isEmpty, orderBy, pullAt, find, camelCase, isNumber,
  cloneDeep, isPlainObject, isArray, isString, set, omit, keys, indexOf,
  last, get, has, values, dropRight, mergeWith
} = lodash

class BajoCore extends Plugin {
  constructor (app) {
    super('bajo', app)
    this.runAt = new Date()
    this.mainNs = 'main'
    this.lib._ = lodash
    this.lib.fs = fs
    this.lib.fastGlob = fastGlob
    this.lib.sprintf = sprintf
    this.lib.outmatch = outmatch
    this.lib.dayjs = dayjs
    this.lib.BajoPlugin = BajoPlugin
    this.applets = []
    this.pluginPkgs = []
    this.pluginNames = []
    this.configHandlers = [
      { ext: '.js', readHandler: this._defConfigHandler },
      { ext: '.json', readHandler: this.readJson }
    ]
    this.whiteSpace = [' ', '\t', '\n', '\r']
    this.logLevels = logLevels
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

  arrangeArray = (inputs, trimItem = true) => {
    const first = []
    const last = []

    const items = filter(inputs, item => {
      if (trimItem) item = trim(item)
      if (item[0] === '^') first.push(item.slice(1))
      else if (item[0] === '$') last.push(item.slice(1))
      return !['^', '$'].includes(item[0])
    })
    items.unshift(...first)
    items.push(...last)
    return items
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

  breakNsPath = (item = '', defaultNs = 'bajo', checkNs = true) => {
    let [ns, ...path] = item.split(':')
    let subNs
    let subSubNs
    path = path.join(':')
    if (path.startsWith('//')) return { ns: undefined, path: item } // for: http:// etc
    if (isEmpty(path)) {
      path = ns
      ns = defaultNs
    }
    [ns, subNs, subSubNs] = ns.split('.')
    if (checkNs) {
      if (!this.app[ns]) {
        const plugin = this.getPlugin(ns)
        if (plugin) ns = plugin.name
      }
      if (!this.app[ns]) throw this.error('unknownPluginOrNotLoaded%s')
    }
    const fullPath = path
    let qs
    [path, qs] = path.split('?')
    qs = querystring.parse(qs) ?? {}
    return { ns, path, subNs, subSubNs, qs, fullPath }
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
    for (const c of items) {
      for (const d of dupChecks) {
        if (isFunction(d)) await d.call(this.app[ns], c, items)
        else {
          const checker = set({}, d, c[d])
          const match = filter(items, checker)
          if (match.length > 1) this.app[ns].fatal('oneOrMoreSharedTheSame%s%s', container, this.join(dupChecks.filter(i => !isFunction(i))))
        }
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
        const method = bajo.getMethod(item)
        if (method) result = await method(...args)
      }
    } else if (isFunction(item)) {
      result = await item.call(scope, ...args)
    } else if (isPlainObject(item) && item.handler) {
      result = await item.handler.call(scope, ...args)
    }
    return result
  }

  defaultsDeep = (...args) => {
    const output = {}
    args.reverse().forEach(function (item) {
      mergeWith(output, item, function (objectValue, sourceValue) {
        return isArray(sourceValue) ? sourceValue : undefined
      })
    })
    return output
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
        const base = prefix === '' ? this.app[ns].dir.pkg : `${this.app[ns].dir.pkg}/${prefix}`
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

  extractText = (text, patternStart, patternEnd) => {
    let result = ''
    const open = text.indexOf(patternStart)
    if (open > -1) {
      text = text.slice(open + patternStart.length)
      const close = text.indexOf(patternEnd)
      if (close > -1) {
        result = text.slice(0, close)
      }
    }
    const pattern = `${patternStart}${result}${patternEnd}`
    return { result, pattern }
  }

  format = (value, type, options = {}) => {
    const { format } = this.config.intl
    const { emptyValue = format.emptyValue } = options
    const lang = options.lang ?? this.config.lang
    if ([undefined, null, ''].includes(value)) return emptyValue
    if (type === 'auto') {
      if (value instanceof Date) type = 'datetime'
    }
    if (['integer', 'smallint'].includes(type)) {
      value = parseInt(value)
      if (isNaN(value)) return emptyValue
      const setting = this.defaultsDeep(options.integer, format.integer)
      return new Intl.NumberFormat(lang, setting).format(value)
    }
    if (['float', 'double'].includes(type)) {
      value = parseFloat(value)
      if (isNaN(value)) return emptyValue
      if (this.app.bajoSpatial && options.latitude) return this.app.bajoSpatial.latToDms(value)
      if (this.app.bajoSpatial && options.longitude) return this.app.bajoSpatial.lngToDms(value)
      const setting = this.defaultsDeep(options.float, format.float)
      return new Intl.NumberFormat(lang, setting).format(value)
    }
    if (['datetime', 'date'].includes(type)) {
      const setting = this.defaultsDeep(options[type], format[type])
      return new Intl.DateTimeFormat(lang, setting).format(new Date(value))
    }
    if (['time'].includes(type)) {
      const setting = this.defaultsDeep(options.time, format.time)
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

  getKeyByValue = (object, value) => {
    return Object.keys(object).find(key => object[key] === value)
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
    if (pkgName === 'main') return resolvePath(process.env.BAJOCWD)
    if (base === 'main') base = process.env.BAJOCWD
    else if (this && this.app && this.app[base]) base = this.app[base].pkgName
    const pkgPath = pkgName + '/package.json'
    const paths = require.resolve.paths(pkgPath)
    const gdir = this.getGlobalModuleDir()
    paths.unshift(gdir)
    paths.unshift(resolvePath(path.join(process.env.BAJOCWD, 'node_modules')))
    let dir = this.findDeep(pkgPath, paths)
    if (base && !dir) dir = this.findDeep(`${base}/node_modules/${pkgPath}`, paths)
    if (!dir) return null
    return resolvePath(path.dirname(dir))
  }

  getPluginDataDir = (name, ensureDir = true) => {
    const { getPlugin } = this.app.bajo
    const plugin = getPlugin(name)
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
    const result = {}
    const notFound = []
    let opts = { returnDefault: true, thrownNotFound: false }
    if (isPlainObject(last(pkgs))) {
      opts = this.defaultsDeep(pkgs.pop(), opts)
    }
    for (const pkg of pkgs) {
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

  includes = (matcher = [], array = []) => {
    if (typeof matcher === 'string') matcher = [matcher]
    let found = false
    for (const m of matcher) {
      found = array.includes(m)
      if (found) break
    }
    return found
  }

  isClass = (item) => {
    return typeof item === 'function' &&
      Object.prototype.hasOwnProperty.call(item, 'prototype') &&
      !Object.prototype.hasOwnProperty.call(item, 'arguments')
  }

  isEmptyDir = async (dir) => {
    await fs.exists(dir)
    return await emptyDir(dir)
  }

  isLogInRange = (level) => {
    const levels = keys(this.logLevels)
    const logLevel = indexOf(levels, this.app.bajo.config.log.level)
    return indexOf(levels, level) >= logLevel
  }

  isSet = (input) => {
    return ![null, undefined].includes(input)
  }

  isValidApp = (dir) => {
    if (!dir) dir = process.env.BAJOCWD
    dir = resolvePath(dir)
    const hasMainDir = fs.existsSync(`${dir}/main/plugin`)
    const hasPackageJson = fs.existsSync(`${dir}/package.json`)
    return hasMainDir && hasPackageJson
  }

  isValidPlugin = (dir) => {
    if (!dir) dir = process.env.BAJOCWD
    dir = resolvePath(dir)
    const hasPluginDir = fs.existsSync(`${dir}/plugin`)
    const hasPackageJson = fs.existsSync(`${dir}/package.json`)
    return hasPluginDir && hasPackageJson
  }

  join = (array, sep) => {
    const translate = val => {
      if (this && this.print) return this.print.write(val).toLowerCase()
      return val
    }
    if (array.length === 0) return translate('none')
    if (array.length === 1) return array[0]
    if (this.isSet(sep) && !isPlainObject(sep)) return array.join(sep)
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

  paginate = (collection, { page = 1, limit = 25, sort } = {}) => {
    const count = collection.length
    const offset = (page - 1) * limit
    const fields = []
    const dirs = []
    if (isPlainObject(sort)) {
      forOwn(sort, (v, k) => {
        fields.push(k)
        dirs.push(v < 0 ? 'desc' : 'asc')
      })
    }
    if (!isEmpty(fields)) collection = orderBy(collection, fields, dirs)
    const data = collection.slice(offset, offset + limit)

    return {
      data,
      page,
      limit,
      count,
      pages: Math.ceil(collection.length / limit)
    }
  }

  parseDur = (val) => {
    return isNumber(val) ? val : ms(val)
  }

  parseDt = (val) => {
    const dt = this.lib.dayjs(val)
    if (!dt.isValid()) throw this.error('dtUnparsable%s', val)
    return dt.toDate()
  }

  parseObject = (input, { silent = true, parseValue = false, lang, ns } = {}) => {
    const statics = ['*']
    let obj = cloneDeep(input)
    const keys = Object.keys(obj)
    const me = this
    const mutated = []
    keys.forEach(k => {
      const v = obj[k]
      if (isPlainObject(v)) obj[k] = this.parseObject(v)
      else if (isArray(v)) {
        v.forEach((i, idx) => {
          if (isPlainObject(i)) obj[k][idx] = this.parseObject(i)
          else if (statics.includes(i)) obj[k][idx] = i
          else if (parseValue) obj[k][idx] = dotenvParseVariables(set({}, 'item', obj[k][idx]), { assignToProcessEnv: false }).item
          if (isArray(obj[k][idx])) obj[k][idx] = obj[k][idx].map(item => typeof item === 'string' ? item.trim() : item)
        })
      } else if (this.isSet(v)) {
        try {
          if (statics.includes(v)) obj[k] = v
          else if (k.startsWith('t:') && isString(v)) {
            const newK = k.slice(2)
            if (lang) {
              const scope = ns ? me.app[ns] : me
              const [text, ...args] = v.split('|')
              obj[newK] = scope.print.write(text, ...args, { lang })
            } else obj[newK] = v
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

  pascalCase = (text) => {
    return upperFirst(camelCase(text))
  }

  pick = (obj, items, excludeUnset) => {
    const result = {}
    for (const item of items) {
      const [k, nk] = item.split(':')
      if (excludeUnset && !this.isSet(obj[k])) continue
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

  round = (val, scale = 0) => {
    scale = scale <= 0 ? 1 : 10 ** scale
    return Math.round(val * scale) / scale
  }

  runHook = async (hookName, ...args) => {
    const [ns, path] = (hookName ?? '').split(':')
    let fns = filter(this.app.bajo.hooks, { ns, path })
    if (isEmpty(fns)) return
    fns = orderBy(fns, ['level'])
    const results = []
    const removed = []
    for (const i in fns) {
      const fn = fns[i]
      const scope = this.app[fn.src]
      const res = await fn.handler.call(scope, ...args)
      results.push({
        hook: hookName,
        resp: res
      })
      if (path.startsWith('once')) removed.push(i)
      if (this.config.log.traceHook) scope.log.trace('hookExecuted%s', hookName)
    }
    if (removed.length > 0) pullAt(this.app.bajo.hooks, removed)

    return results
  }

  saveAsDownload = async (file, obj, printSaved = true) => {
    const { print, getPluginDataDir } = this.app.bajo
    const plugin = this.name
    const fname = increment(`${getPluginDataDir(plugin)}/${trim(file, '/')}`, { fs: true })
    const dir = path.dirname(fname)
    if (!fs.existsSync(dir)) fs.ensureDirSync(dir)
    await fs.writeFile(fname, obj, 'utf8')
    if (printSaved) print.succeed('savedAs%s', path.resolve(fname), { skipSilence: true })
    return fname
  }

  // based on: https://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
  secToHms = (secs, ms) => {
    let remain
    if (ms) {
      remain = secs % 1000
      secs = Math.floor(secs / 1000)
    }
    const secNum = parseInt(secs, 10)
    const hours = Math.floor(secNum / 3600)
    const minutes = Math.floor(secNum / 60) % 60
    const seconds = secNum % 60

    let hms = [hours, minutes, seconds]
      .map(v => v < 10 ? '0' + v : v)
      .filter((v, i) => v !== '00' || i > 0)
      .join(':')
    if (ms) hms += '+' + padStart(remain, 3, '0')
    return hms
  }

  titleize = (text, { ignores = [], replacement = {} } = {}) => {
    const defIgnores = ['or', 'and', 'of', 'with']
    const replacer = {}
    forOwn(replacement, (v, k) => {
      const id = this.generateId('int')
      replacer[id] = k
      text = text.replace(k, ` ${id} `)
    })
    return map(words(text), t => {
      forOwn(replacer, (v, k) => {
        if (k === t) t = replacement[replacer[k]]
      })
      ignores = uniq(concat(ignores, defIgnores))
      if (ignores.includes(t)) return t
      return upperFirst(t)
    }).join(' ')
  }
}

export default BajoCore
