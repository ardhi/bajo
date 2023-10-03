import { isEmpty } from 'lodash-es'

function breakNsPath (item = '') {
  const { error, getPlugin } = this.bajo.helper
  let [ns, path] = item.split(':')
  if (isEmpty(path)) {
    path = ns
    ns = null
  }
  // if (path.startsWith('.')) throw error('Path \'%s\' must be an absolute path', path)
  if (!this[ns]) ns = (getPlugin(ns) || {}).name
  if (!this[ns]) throw error('Unknown plugin \'%s\' or plugin isn\'t loaded yet', ns)
  return [ns, path]
}

export default breakNsPath
