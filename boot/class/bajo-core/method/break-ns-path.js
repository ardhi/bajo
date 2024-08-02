import { isEmpty } from 'lodash-es'

function breakNsPath (item = '', defaultNs = 'bajo') {
  let [ns, ...path] = item.split(':')
  let subNs
  path = path.join(':')
  if (path.startsWith('//')) return [undefined, item]
  if (isEmpty(path)) {
    path = ns
    ns = defaultNs
  }
  [ns, subNs] = ns.split('.')
  if (!this.app[ns]) {
    const plugin = this.getPlugin(ns)
    if (plugin) ns = plugin.name
  }
  if (!this.app[ns]) throw this.error('Unknown plugin \'%s\' or plugin isn\'t loaded yet')
  return [ns, path, subNs]
}

export default breakNsPath
