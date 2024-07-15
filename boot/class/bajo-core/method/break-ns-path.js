import { isEmpty } from 'lodash-es'

function breakNsPath (item = '', defaultNs = 'bajo') {
  let [ns, ...path] = item.split(':')
  path = path.join(':')
  if (isEmpty(path)) {
    path = ns
    ns = defaultNs
  }
  if (ns.length === 1) return [ns, path].join(':') // windows fs
  if (!this.app[ns]) {
    const plugin = this.getPlugin(ns)
    if (plugin) ns = plugin.name
  }
  if (!this.app[ns]) throw this.error('Unknown plugin \'%s\' or plugin isn\'t loaded yet')
  return [ns, path]
}

export default breakNsPath
