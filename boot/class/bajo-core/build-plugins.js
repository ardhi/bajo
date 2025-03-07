import lodash from 'lodash'
import fs from 'fs-extra'
import resolvePath from '../../lib/resolve-path.js'

const { isString, filter, map, trim, without, uniq, camelCase, isEmpty } = lodash

async function buildPlugins () {
  let pluginPkgs = this.config.plugins ?? []
  if (isString(pluginPkgs)) pluginPkgs = [pluginPkgs]
  const pluginsFile = `${this.dir.data}/config/.plugins`
  if (fs.existsSync(pluginsFile)) {
    pluginPkgs = pluginPkgs.concat(filter(map(trim(fs.readFileSync(pluginsFile, 'utf8')).split('\n'), p => trim(p)), b => !isEmpty(b)))
  }
  this.pluginPkgs = map(filter(without(uniq(pluginPkgs), this.mainNs), p => {
    return p[0] !== '#'
  }), p => {
    return trim(p.split('#')[0])
  })
  this.pluginPkgs.push(this.mainNs)
  for (const pkg of this.pluginPkgs) {
    const ns = camelCase(pkg)
    const dir = ns === this.mainNs ? (`${this.dir.base}/${this.mainNs}`) : this.getModuleDir(pkg)
    if (ns !== this.mainNs && !fs.existsSync(`${dir}/plugin`)) throw new Error(`Package '${pkg}' isn't a valid Bajo package`)
    let plugin
    const factory = `${dir}/plugin/factory.js`
    if (fs.existsSync(factory)) {
      const { default: builder } = await import(resolvePath(factory, true))
      const FactoryClass = await builder.call(this, pkg)
      plugin = new FactoryClass()
      if (!(plugin instanceof this.lib.BajoPlugin)) throw new Error(`Plugin package '${pkg}' should be an instance of BajoPlugin`)
    } else {
      plugin = new this.lib.BajoPlugin(pkg, this.app)
    }
    this.pluginNames.push(plugin.name)
    this.app.addPlugin(plugin)
  }
  delete this.config.plugins
}

export default buildPlugins
