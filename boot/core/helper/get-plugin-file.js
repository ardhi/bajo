import { get } from 'lodash-es'
import breakNsPath from './break-ns-path.js'

function getPluginFile (file) {
  if (!get(this, 'app.bajo.helper')) return file
  if (file.includes(':')) {
    const [ns, path] = breakNsPath.call(this, file)
    if (ns !== 'file' && this && this.app && this.app[ns] && ns.length > 1) {
      const dir = get(this.app[ns], 'config.dir.pkg')
      file = `${dir}${path}`
    }
  }
  return file
}

export default getPluginFile
