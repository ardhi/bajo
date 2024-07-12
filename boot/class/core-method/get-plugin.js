import { find } from 'lodash-es'

export default function (name) {
  const { error } = this.app.bajo
  if (!this.app[name]) {
    // alias?
    const ref = find(this.app.bajo.pluginRefs ?? [], { alias: name })
    if (!ref) throw error('\'%s\' is not loaded', name)
    name = ref.plugin
  }
  return this.app[name]
}
