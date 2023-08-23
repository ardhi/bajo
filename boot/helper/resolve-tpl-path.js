import { trim } from 'lodash-es'
import fs from 'fs-extra'

function resolveTplPath (name, baseTpl, extTpl = '') {
  const { getConfig, breakNsPath } = this.bajo.helper
  const [ns, path] = breakNsPath(name)
  const cfgNs = getConfig(ns, { full: true })
  const cfgApp = getConfig('app', { full: true })
  let file = `${cfgNs.dir}/${baseTpl}/${trim(path, '/')}${extTpl}`
  const override = `${cfgApp.dir}/${baseTpl}/override/${ns}/${trim(path, '/')}${extTpl}`
  if (fs.existsSync(override)) file = override
  return file
}

export default resolveTplPath
