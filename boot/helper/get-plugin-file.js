import { get } from 'lodash-es'

function getPluginFile (file) {
  if (file.includes(':')) {
    const [plugin, path] = file.split(':')
    if (plugin !== 'file' && this && this[plugin] && plugin.length > 1) {
      const dir = get(this[plugin], 'config.dir.pkg')
      file = `${dir}${path}`
    }
  }
  return file
}

export default getPluginFile
