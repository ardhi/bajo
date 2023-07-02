import os from 'os'
import gpath from 'global-modules-path'

let bajo
try {
  bajo = await import('bajo')
} catch (err) {}
if (!bajo) {
  let bootFile = `${gpath.getPath('bajo')}/boot/index.js`
  if (os.platform() === 'win32') bootFile = 'file:///' + bootFile
  bajo = await import(bootFile)
}
const scope = await bajo.default()
// do whatever necessary to scope
