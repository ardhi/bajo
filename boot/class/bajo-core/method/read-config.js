import path from 'path'
import resolvePath from './resolve-path.js'
import getPluginFile from './get-plugin-file.js'
import readJson from './read-json.js'
import parseObject from './parse-object.js'
import lodash from 'lodash'
import fg from 'fast-glob'

const { find, map, isEmpty } = lodash

async function readConfig (file, { ns, pattern, globOptions = {}, ignoreError, defValue = {}, opts = {} } = {}) {
  if (!ns) ns = this.name
  file = resolvePath(getPluginFile.call(this, file))
  let ext = path.extname(file)
  const fname = path.dirname(file) + '/' + path.basename(file, ext)
  ext = ext.toLowerCase()
  if (['.mjs', '.js'].includes(ext)) {
    const { readHandler } = find(this.app.bajo.configHandlers, { ext })
    return parseObject(await readHandler.call(this.app[ns], file, opts))
  }
  if (ext === '.json') return await readJson(file)
  if (!['', '.*'].includes(ext)) {
    const item = find(this.app.bajo.configHandlers, { ext })
    if (!item) {
      if (!ignoreError) throw this.error('cantParse%s', file, { code: 'BAJO_CONFIG_NO_PARSER' })
      return parseObject(defValue)
    }
    return parseObject(await item.readHandler.call(this.app[ns], file, opts))
  }
  const item = pattern ?? `${fname}.{${map(map(this.app.bajo.configHandlers, 'ext'), k => k.slice(1)).join(',')}}`
  const files = await fg(item, globOptions)
  if (files.length === 0) {
    if (!ignoreError) throw this.error('noConfigFileFound', { code: 'BAJO_CONFIG_FILE_NOT_FOUND' })
    return parseObject(defValue)
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
  return parseObject(config)
}

export default readConfig
