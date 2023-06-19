import path from 'path'
import os from 'os'

export default {
  handler: function (item, asFileUrl) {
    item = path.resolve(item)
    if (os.platform() === 'win32') {
      item = item.replace(/\\/g, '/')
    }
    if (asFileUrl) item = `file://${item}`
    return item
  },
  noScope: true
}
