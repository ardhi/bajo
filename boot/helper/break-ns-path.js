import { isEmpty, find } from 'lodash-es'

function breakNsPath (item = '', defaultNs = 'bajo') {
  const { error } = this.bajo.helper
  let [ns, ...path] = item.split(':')
  path = path.join(':')
  if (isEmpty(path)) {
    path = ns
    ns = defaultNs
  }
  if (ns.length === 1) return [ns, path].join(':') // windows fs
  if (!this[ns]) {
    const ref = find(this.bajo.pluginRefs ?? [], { alias: ns })
    if (ref) ns = ref.plugin
  }
  if (!this[ns]) throw error('Unknown plugin \'%s\' or plugin isn\'t loaded yet', ns)
  return [ns, path]
}

export default breakNsPath
