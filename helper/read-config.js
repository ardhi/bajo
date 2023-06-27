import path from 'path'
import pathResolve from './path-resolve.js'
import readJson from './read-json.js'
import _ from 'lodash'
import error from './error.js'
import fg from 'fast-glob'

export default async function (file, { pattern, globOptions = {} } = {}) {
  file = pathResolve.handler(file)
  let ext = path.extname(file)
  const fname = path.dirname(file) + '/' + path.basename(file, ext)
  ext = ext.toLowerCase()
  if (['.mjs', '.js'].includes(ext)) return await defHandler.call(this, file)
  if (ext === '.json') return await readJson.handler(file)
  if (!['', '.*'].includes(ext)) {
    const item = _.find(this.bajo.configHandlers, { ext })
    if (!item) throw error.handler(`Can\'t parse '${f}'`, { code: 'BAJO_CONFIG_NO_PARSER' })
    return item.handler.call(this, file)
  }
  const item = pattern || `${fname}.{${_.map(_.map(this.bajo.configHandlers, 'ext'), k => k.slice(1)).join(',')}}`
  const files = await fg(item, globOptions)
  if (files.length === 0) throw error.handler('No config file found', { code: 'BAJO_CONFIG_FILE_NOT_FOUND' })
  let config = {}
  for (const f of files) {
    const ext = path.extname(f).toLowerCase()
    const item = _.find(this.bajo.configHandlers, { ext })
    if (!item) throw error.handler(`Can\'t parse '${f}'`, { code: 'BAJO_CONFIG_NO_PARSER' })
    config = await item.handler.call(this, f)
    if (!_.isEmpty(config)) break
  }
  return config
}
