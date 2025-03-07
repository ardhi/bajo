import path from 'path'
import { fileURLToPath } from 'url'
import os from 'os'

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
