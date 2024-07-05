import path from 'path'
import resolvePath from './resolve-path.js'
import getPluginFile from './get-plugin-file.js'
import readJson from './read-json.js'
import parseObject from './parse-object.js'
import { find, map, isEmpty } from 'lodash-es'
import error from './error.js'
import fg from 'fast-glob'

async function readConfig (file, { pattern, globOptions = {}, ignoreError, defValue = {} } = {}) {
  file = resolvePath(getPluginFile.call(this, file))
  let ext = path.extname(file)
  const fname = path.dirname(file) + '/' + path.basename(file, ext)
  ext = ext.toLowerCase()
  if (['.mjs', '.js'].includes(ext)) {
    const { handler } = find(this.app.bajo.configHandlers, { ext })
    return parseObject(await handler.call(this, file))
  }
  if (ext === '.json') return await readJson(file)
  if (!['', '.*'].includes(ext)) {
    const item = find(this.app.bajo.configHandlers, { ext })
    if (!item) {
      if (!ignoreError) throw error.call(this, 'Can\'t parse \'%s\'', file, { code: 'BAJO_CONFIG_NO_PARSER' })
      return parseObject(defValue)
    }
    return parseObject(item.handler.call(this, file))
  }
  const item = pattern ?? `${fname}.{${map(map(this.app.bajo.configHandlers, 'ext'), k => k.slice(1)).join(',')}}`
  const files = await fg(item, globOptions)
  if (files.length === 0) {
    if (!ignoreError) throw error.call(this, 'No config file found', { code: 'BAJO_CONFIG_FILE_NOT_FOUND' })
    return parseObject(defValue)
  }
  let config = defValue
  for (const f of files) {
    const ext = path.extname(f).toLowerCase()
    const item = find(this.app.bajo.configHandlers, { ext })
    if (!item) {
      if (!ignoreError) throw error.call(this, 'Can\'t parse \'%s\'', f, { code: 'BAJO_CONFIG_NO_PARSER' })
      continue
    }
    config = await item.handler.call(this, f)
    if (!isEmpty(config)) break
  }
  return parseObject(config)
}

export default readConfig
