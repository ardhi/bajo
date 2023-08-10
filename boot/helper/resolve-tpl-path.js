import { isEmpty, trim } from 'lodash-es'
import fs from 'fs-extra'

function resolveTplPath (name, baseTpl, extTpl = '') {
  const { error, getConfig } = this.bajo.helper
  let [ns, path] = name.split(':')
  if (isEmpty(path)) {
    path = ns
    ns = 'app'
  }
  if (path.startsWith('.')) throw error('Path \'%s\' must be an absolute path', path)
  if (!this[ns]) throw error('Unknown plugin \'%s\' or plugin isn\'t loaded yet', ns)
  const cfgNs = getConfig(ns, { full: true })
  const cfgApp = getConfig('app', { full: true })
  let file = `${cfgNs.dir}/${baseTpl}/${trim(path, '/')}${extTpl}`
  const override = `${cfgApp.dir}/${baseTpl}/override/${ns}/${trim(path, '/')}${extTpl}`
  if (fs.existsSync(override)) file = override
  return file
}

export default resolveTplPath
