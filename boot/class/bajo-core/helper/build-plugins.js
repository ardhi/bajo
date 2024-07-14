import { isString, filter, map, trim, without, uniq, camelCase, isEmpty } from 'lodash-es'
import fs from 'fs-extra'
import getModuleDir from '../method/get-module-dir.js'
import BajoPlugin from '../../bajo-plugin.js'

async function buildPlugins () {
  let plugins = this.config.plugins ?? []
  if (isString(plugins)) plugins = [plugins]
  const pluginsFile = `${this.config.dir.data}/config/.plugins`
  if (fs.existsSync(pluginsFile)) {
    plugins = plugins.concat(filter(map(trim(fs.readFileSync(pluginsFile, 'utf8')).split('\n'), p => trim(p)), b => !isEmpty(b)))
  }
  this.config.plugins = without(uniq(plugins, this.mainNs))
  this.config.plugins.push(this.mainNs)
  for (const pkg of this.config.plugins) {
    const ns = camelCase(pkg)
    const dir = ns === this.mainNs ? (`${this.config.dir.base}/${this.mainNs}`) : getModuleDir.call(this, pkg)
    if (ns !== this.mainNs && !fs.existsSync(`${dir}/${this.name}`)) throw new Error(`Package '${pkg}' isn't a valid Bajo package`)
    const plugin = new BajoPlugin(pkg, this.app)
    this.app.addPlugin(plugin)
  }
}

export default buildPlugins
