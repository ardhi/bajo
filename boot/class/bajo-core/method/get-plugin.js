import BajoPlugin from '../../bajo-plugin.js'

function getPlugin (name, silent) {
  if (!this.app[name]) {
    // alias?
    let plugin
    for (const key in this.app) {
      const item = this.app[key]
      if (item instanceof BajoPlugin && (item.alias === name || item.pkgName === name)) {
        plugin = item
        break
      }
    }
    if (!plugin) {
      if (silent) return false
      throw this.error('Plugin with alias \'%s\' is not loaded', name)
    }
    name = plugin.name
  }
  return this.app[name]
}

export default getPlugin
