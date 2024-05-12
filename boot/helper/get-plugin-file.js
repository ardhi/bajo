import { get } from 'lodash-es'
import breakNsPath from './break-ns-path.js'

function getPluginFile (file) {
  if (!get(this, 'bajo.helper')) return file
  if (file.includes(':')) {
    const [plugin, path] = breakNsPath.call(this, file)
    if (plugin !== 'file' && this && this[plugin] && plugin.length > 1) {
      const dir = get(this[plugin], 'config.dir.pkg')
      file = `${dir}${path}`
    }
  }
  return file
}

export default getPluginFile
