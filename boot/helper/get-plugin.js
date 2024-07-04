import { find } from 'lodash-es'

function getPlugin (name) {
  const { error } = this.app.bajo.helper
  if (!this.app[name]) {
    // alias?
    const ref = find(this.app.bajo.pluginRefs ?? [], { alias: name })
    if (!ref) throw error('\'%s\' is not loaded', name)
    name = ref.plugin
  }
  return this.app[name]
}

export default getPlugin
