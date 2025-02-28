import breakNsPath from './break-ns-path.js'
import currentLoc from '../../../lib/current-loc.js'
import lodash from 'lodash'

const { trim } = lodash

function getPluginFile (file) {
  if (!this) return file
  if (file[0] === '.') file = `${currentLoc(import.meta).dir}/${trim(file.slice(1), '/')}`
  if (!this) return file
  if (file.includes(':')) {
    if (file.slice(1, 2) === ':') return file // windows fs
    const { ns, path } = breakNsPath.call(this, file)
    if (ns !== 'file' && this && this.app && this.app[ns] && ns.length > 1) {
      file = `${this.app[ns].dir.pkg}${path}`
    }
  }
  return file
}

export default getPluginFile
