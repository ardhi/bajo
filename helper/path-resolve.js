import path from 'path'
import os from 'os'

export default {
  handler: function (item, asFileUrl) {
    if (item.startsWith('file://')) item = item.slice(item[7] !== '/' ? 7 : 8)
    item = path.resolve(item)
    if (os.platform() === 'win32') {
      item = item.replace(/\\/g, '/')
    }
    if (asFileUrl) item = `file://${item}`
    return item
  },
  noScope: true
}
