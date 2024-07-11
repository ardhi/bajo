import os from 'os'
import fs from 'fs-extra'
import Core from './core.js'
import Plugin from './plugin.js'
import { isFunction, set, get, filter, uniq, map, trim, without, isEmpty, camelCase, isPlainObject } from 'lodash-es'
import importModule from './core/method/import-module.js'
import readJson from './core/method/read-json.js'
import parseArgsArgv from './lib/parse-args-argv.js'
import parseEnv from './lib/parse-env.js'
import defaultsDeep from './core/method/defaults-deep.js'
import resolvePath from './core/method/resolve-path.js'
import currentLoc from './core/method/current-loc.js'
import getModuleDir from './core/method/get-module-dir.js'

async function defConfigHandler (file) {
  let mod = await importModule(file)
  if (isFunction(mod)) mod = await mod.call(this)
  return mod
}

async function collectConfigHandlers (bajo) {
  for (const pkg of bajo.config.plugins) {
    let dir
    try {
      dir = getModuleDir.call(bajo, pkg)
    } catch (err) {}
    if (!dir) continue
    const file = `${dir}/bajo/config-handlers.js`
    let mod = await importModule.call(bajo, file)
    if (!mod) continue
    const scope = bajo.app[camelCase(pkg)]
    if (isFunction(mod)) mod = await mod.call(scope)
    if (isPlainObject(mod)) mod = [mod]
    bajo.configHandlers = bajo.configHandlers.concat(mod)
  }
}

async function app (cwd) {
  const app = new Core()
  // bajo
  const bajo = new Plugin('bajo', app)
  bajo.configHandlers = [
    { ext: '.js', readHandler: defConfigHandler },
    { ext: '.json', readHandler: readJson }
  ]
  const { args, argv } = await parseArgsArgv.call(app)
  const env = parseEnv.call(app)
  bajo.toolMode = argv.root.tool
  bajo.config = defaultsDeep({}, env.root, argv.root)
  bajo.config.name = 'bajo'
  bajo.config.alias = 'bajo'
  set(bajo, 'config.dir.base', cwd)
  set(bajo, 'config.dir.pkg', resolvePath(currentLoc(import.meta).dir + '/..'))
  if (!get(bajo, 'config.dir.data')) set(bajo, 'config.dir.data', `${bajo.config.dir.base}/data`)
  bajo.config.dir.data = resolvePath(bajo.config.dir.data)
  if (!bajo.config.dir.tmp) {
    bajo.config.dir.tmp = resolvePath(os.tmpdir()) + '/bajo'
    fs.ensureDirSync(bajo.config.dir.tmp)
  }
  bajo.config.args = args
  app.addPlugin(bajo)
  // add all plugins now
  bajo.config.plugins = []
  const pluginsFile = `${bajo.config.dir.data}/config/.plugins`
  if (fs.existsSync(pluginsFile)) {
    bajo.config.plugins = filter(uniq(map(trim(fs.readFileSync(pluginsFile, 'utf8')).split('\n'), p => trim(p))), b => !isEmpty(b))
  }
  bajo.config.plugins = without(bajo.config.plugins, 'main')
  bajo.config.plugins.push('main')
  bajo.log.init()
  for (const pkg of bajo.config.plugins) {
    const ns = camelCase(pkg)
    const dir = ns === 'main' ? (bajo.config.dir.base + '/main') : getModuleDir.call(bajo, pkg)
    if (ns !== 'main' && !fs.existsSync(`${dir}/bajo`)) throw new Error(`Package '${pkg}' isn't a valid Bajo package`)
    const plugin = new Plugin(ns, app)
    app.addPlugin(plugin)
  }
  await collectConfigHandlers(bajo)
  return app
}

export default app
