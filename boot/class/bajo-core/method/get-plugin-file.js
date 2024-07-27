import breakNsPath from './break-ns-path.js'

function getPluginFile (file) {
  if (!this) return file
  if (file.includes(':')) {
    if (file.slice(1, 2) === ':') return file // windows fs
    const [ns, path] = breakNsPath.call(this, file)
    if (ns !== 'file' && this && this.app && this.app[ns] && ns.length > 1) {
      file = `${this.app[ns].config.dir.pkg}${path}`
    }
  }
  return file
}

export default getPluginFile
