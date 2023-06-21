import path from 'path'
import pathResolve from './path-resolve.js'
import importModule from './import-module.js'
import getModuleDir from './get-module-dir.js'
import readJson from './read-json.js'
import _ from 'lodash'
import error from './error.js'
import fg from 'fast-glob'
import fs from 'fs-extra'

async function defHandler (file) {
  let mod = await importModule.handler(file)
  if (_.isFunction(mod)) mod = await mod.call(this)
  return mod
}

export default async function (file, { pattern, globOptions = {} } = {}) {
  file = pathResolve.handler(file)
  let ext = path.extname(file)
  const fname = path.dirname(file) + '/' + path.basename(file, ext)
  ext = ext.toLowerCase()
  if (['.mjs', '.js'].includes(ext)) return await defHandler.call(this, file)
  if (ext === '.json') return await readJson.handler.call(file)
  const handlers = { '.mjs': defHandler, '.js': defHandler, '.json': readJson.handler }
  // todo: it should run only once!
  if ((this.bajo.config || {}).bajos) {
    for (const pkg of this.bajo.config.bajos) {
      let dir
      try {
        dir = getModuleDir.handler(pkg)
      } catch (err) {}
      if (!dir) continue
      const file = `${dir}/bajo/extend/read-config.js`
      if (!fs.existsSync(file)) continue
      try {
        let mod = await importModule.handler(file)
        if (_.isFunction(mod)) mod = await mod.call(this)
        if (_.isPlainObject(mod)) _.merge(handlers, mod)
      } catch (err) {
        console.log(err)
      }
    }
  }
  if (!['', '.*'].includes(ext)) {
    const handler = handlers[ext]
    if (!handler) throw error.handler(`Can\'t parse '${f}'`, { code: 'BAJO_CONFIG_NO_PARSER' })
    return handler.call(this, file)
  }
  const item = pattern || `${fname}.{${_.map(_.keys(handlers), k => k.slice(1)).join(',')}}`
  const files = await fg(item, globOptions)
  if (files.length === 0) throw error.handler('No config file found', { code: 'BAJO_CONFIG_FILE_NOT_FOUND' })
  let config = {}
  for (const f of files) {
    const ext = path.extname(f).toLowerCase()
    const handler = handlers[ext]
    if (!handler) throw error.handler(`Can\'t parse '${f}'`, { code: 'BAJO_CONFIG_NO_PARSER' })
    config = await handler.call(this, f)
    if (!_.isEmpty(config)) break
  }
  return config
}
