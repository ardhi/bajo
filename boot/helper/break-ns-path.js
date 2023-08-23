import { isEmpty } from 'lodash-es'

function breakNsPath (name) {
  const { error } = this.bajo.helper
  let [ns, path] = name.split(':')
  if (isEmpty(path)) {
    path = ns
    ns = 'app'
  }
  if (path.startsWith('.')) throw error('Path \'%s\' must be an absolute path', path)
  if (!this[ns]) throw error('Unknown plugin \'%s\' or plugin isn\'t loaded yet', ns)
  return [ns, path]
}

export default breakNsPath
