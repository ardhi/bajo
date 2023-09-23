import { find } from 'lodash-es'

function getPlugin (name) {
  const { error } = this.bajo.helper
  if (!this[name]) {
    // alias?
    const ref = find(this.bajo.pluginRefs ?? [], { alias: name })
    if (!ref) throw error('\'%s\' is not loaded', name)
    name = ref.name
  }
  return this[name]
}

export default getPlugin
