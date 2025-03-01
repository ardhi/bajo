import lodash from 'lodash'
import querystring from 'querystring'

const { isEmpty } = lodash

function breakNsPath (item = '', defaultNs = 'bajo', checkNs = true) {
  let [ns, ...path] = item.split(':')
  let subNs
  let subSubNs
  path = path.join(':')
  if (path.startsWith('//')) return { ns: undefined, path: item } // for: http:// etc
  if (isEmpty(path)) {
    path = ns
    ns = defaultNs
  }
  [ns, subNs, subSubNs] = ns.split('.')
  if (checkNs) {
    if (!this.app[ns]) {
      const plugin = this.getPlugin(ns)
      if (plugin) ns = plugin.name
    }
    if (!this.app[ns]) throw this.error('unknownPluginOrNotLoaded%s')
  }
  const fullPath = path
  let qs
  [path, qs] = path.split('?')
  qs = querystring.parse(qs) ?? {}
  return { ns, path, subNs, subSubNs, qs, fullPath }
}

export default breakNsPath
