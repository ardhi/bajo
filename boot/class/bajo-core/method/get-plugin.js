import BasePlugin from '../../base-plugin.js'

export default function (name) {
  const { error } = this.app.bajo
  if (!this.app[name]) {
    // alias?
    let plugin
    for (const key in this.app) {
      const item = this.app[key]
      if (item instanceof BasePlugin && (item.alias === name || item.pkgName === name)) {
        plugin = item
        break
      }
    }
    if (!plugin) throw error('Plugin \'%s\' is not loaded', name)
    name = plugin.name
  }
  return this.app[name]
}
