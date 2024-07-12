import os from 'os'
import fs from 'fs-extra'
import BasePlugin from './base-plugin.js'
import BajoPlugin from './bajo-plugin.js'
import dayjs from '../lib/dayjs.js'
import importModule from './core-method/import-module.js'
import readJson from './core-method/read-json.js'
import parseArgsArgv from '../lib/parse-args-argv.js'
import parseEnv from '../lib/parse-env.js'
import readAllConfigs from '../lib/read-all-configs.js'
import defaultsDeep from './core-method/defaults-deep.js'
import resolvePath from './core-method/resolve-path.js'
import currentLoc from './core-method/current-loc.js'
import getModuleDir from './core-method/get-module-dir.js'
import getKeyByValue from './core-method/get-key-by-value.js'
import envs from './core-method/envs.js'
import join from './core-method/join.js'
import omitDeep from 'omit-deep'

import {
  isFunction, set, get, isString, filter, map, trim, pick, values, keys,
  without, uniq, isEmpty, camelCase, isPlainObject
} from 'lodash-es'

const name = 'bajo'
const mainNs = 'main'
const configFilePick = ['log', 'plugins', 'run', 'exitHandler']
const configFileOmit = ['toolMode', 'spawn', 'cwd', 'name', 'alias']

const defConfig = {
  dir: {},
  log: {
    dateFormat: 'YYYY-MM-DDTHH:MM:ss.SSS[Z]',
    toolMode: false,
    report: []
  },
  lang: Intl.DateTimeFormat().resolvedOptions().lang ?? 'en-US',
  exitHandler: true
}

async function defConfigHandler (file) {
  let mod = await importModule(file)
  if (isFunction(mod)) mod = await mod.call(this)
  return mod
}

class BajoCore extends BasePlugin {
  constructor (app) {
    super(name, app)
    this.lib.dayjs = dayjs
    this.configHandlers = [
      { ext: '.js', readHandler: defConfigHandler },
      { ext: '.json', readHandler: readJson }
    ]
  }

  async buildBaseConfig (cwd) {
    const { args, argv } = await parseArgsArgv.call(this.app)
    const env = parseEnv.call(this.app)
    this.toolMode = argv.root.tool
    this.config = defaultsDeep({}, env.root, argv.root)
    this.config.name = name
    this.config.alias = name
    set(this, 'config.dir.base', cwd)
    set(this, 'config.dir.pkg', resolvePath(currentLoc(import.meta).dir + '/../..'))
    if (!get(this, 'config.dir.data')) set(this, 'config.dir.data', `${this.config.dir.base}/data`)
    this.config.dir.data = resolvePath(this.config.dir.data)
    if (!this.config.dir.tmp) {
      this.config.dir.tmp = `${resolvePath(os.tmpdir())}/${name}`
      fs.ensureDirSync(this.config.dir.tmp)
    }
    this.config.args = args
    this.app.addPlugin(this)
  }

  async buildPlugins () {
    let plugins = this.config.plugins ?? []
    if (isString(plugins)) plugins = [plugins]
    const pluginsFile = `${this.config.dir.data}/config/.plugins`
    if (fs.existsSync(pluginsFile)) {
      plugins = plugins.concat(filter(map(trim(fs.readFileSync(pluginsFile, 'utf8')).split('\n'), p => trim(p)), b => !isEmpty(b)))
    }
    this.config.plugins = without(uniq(plugins, mainNs))
    this.config.plugins.push(mainNs)
    for (const pkg of this.config.plugins) {
      const ns = camelCase(pkg)
      const dir = ns === mainNs ? (`${this.config.dir.base}/${mainNs}`) : getModuleDir.call(this, pkg)
      if (ns !== mainNs && !fs.existsSync(`${dir}/${name}`)) throw new Error(`Package '${pkg}' isn't a valid Bajo package`)
      const plugin = new BajoPlugin(ns, this.app)
      this.app.addPlugin(plugin)
    }
  }

  async collectConfigHandlers () {
    for (const pkg of this.config.plugins) {
      let dir
      try {
        dir = getModuleDir.call(this, pkg)
      } catch (err) {}
      if (!dir) continue
      const file = `${dir}/bajo/config-handlers.js`
      let mod = await importModule.call(this, file)
      if (!mod) continue
      if (isFunction(mod)) mod = await mod.call(this.app[camelCase(pkg)])
      if (isPlainObject(mod)) mod = [mod]
      this.configHandlers = this.configHandlers.concat(mod)
    }
  }

  async buildConfig () {
    // config merging
    let resp = await readAllConfigs.call(this.app, `${this.config.dir.data}/config/${name}`)
    resp = omitDeep(pick(resp, configFilePick), configFileOmit)
    this.config = defaultsDeep({}, this.config, resp, defConfig)
    this.config.env = (this.config.env ?? 'dev').toLowerCase()
    if (values(envs).includes(this.config.env)) this.config.env = getKeyByValue(envs, this.config.env)
    if (!keys(envs).includes(this.config.env)) throw new Error(`Unknown environment '${this.config.env}'. Supported: ${join(keys(envs))}`)
    process.env.NODE_ENV = envs[this.config.env]
    if (!this.config.log.level) this.config.log.level = this.config.env === 'dev' ? 'debug' : 'info'
    if (this.config.silent) this.config.log.level = 'silent'
    if (this.toolMode) {
      if (!this.config.plugins.includes('bajo-cli')) throw new Error('Tool mode needs to have \'bajo-cli\' loaded first')
      if (!this.config.log.toolMode) this.config.log.level = 'silent'
      this.config.exitHandler = false
    }
    const exts = map(this.configHandlers, 'ext')
    this.log.init()
    this.log.debug('Config handlers: %s', join(exts))
  }
}

export default BajoCore
