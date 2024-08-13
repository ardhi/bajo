import { isString, filter, map, trim, without, uniq, camelCase, isEmpty } from 'lodash-es'
import fs from 'fs-extra'
import getModuleDir from '../method/get-module-dir.js'
import BajoPlugin from '../../bajo-plugin.js'

async function buildPlugins () {
  let pluginPkgs = this.config.plugins ?? []
  if (isString(pluginPkgs)) pluginPkgs = [pluginPkgs]
  const pluginsFile = `${this.dir.data}/config/.plugins`
  if (fs.existsSync(pluginsFile)) {
    pluginPkgs = pluginPkgs.concat(filter(map(trim(fs.readFileSync(pluginsFile, 'utf8')).split('\n'), p => trim(p)), b => !isEmpty(b)))
  }
  this.pluginPkgs = without(uniq(pluginPkgs, this.mainNs))
  this.pluginPkgs.push(this.mainNs)
  for (const pkg of this.pluginPkgs) {
    const ns = camelCase(pkg)
    const dir = ns === this.mainNs ? (`${this.dir.base}/${this.mainNs}`) : getModuleDir.call(this, pkg)
    if (ns !== this.mainNs && !fs.existsSync(`${dir}/${this.name}`)) throw new Error(`Package '${pkg}' isn't a valid Bajo package`)
    const plugin = new BajoPlugin(pkg, this.app)
    this.app.addPlugin(plugin)
  }
  delete this.config.plugins
}

export default buildPlugins
