import _path from 'path'
import { map, camelCase } from 'lodash-es'

function breakNsPathFromFile ({ file, dir, baseNs, suffix = '', getType } = {}) {
  let item = file.replace(dir + suffix, '')
  let type
  if (getType) {
    const items = item.split('/')
    type = items.shift()
    item = items.join('/')
  }
  item = item.slice(0, item.length - _path.extname(item).length)
  let [name, path] = item.split('@')
  if (!path) {
    path = name
    name = baseNs
  }
  path = camelCase(path)
  const names = map(name.split('.'), n => camelCase(n))
  const [ns, subNs] = names
  return { ns, subNs, path, fullNs: names.join('.'), type }
}

export default breakNsPathFromFile
