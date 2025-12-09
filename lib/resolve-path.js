import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

/**
 * Resolve file name to filesystem's path. Windows path separator ```\```
 * is normalized to Unix's ```/```
 *
 * @memberof module:Lib
 * @param {string} file - File to resolve
 * @param {boolean} [asFileUrl=false] - Return as file URL format ```file:///<name>```
 * @returns {string}
 */
function resolvePath (item, asFileUrl) {
  if (item.startsWith('file://')) item = fileURLToPath(item)
  item = path.resolve(item)
  if (os.platform() === 'win32') {
    item = item.replace(/\\/g, '/')
  }
  if (asFileUrl) item = `file:///${item}`
  return item
}

export default resolvePath
