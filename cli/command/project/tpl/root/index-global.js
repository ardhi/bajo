import os from 'os'
import gpath from 'global-modules-path'

let bootFile = `${gpath.getPath('bajo')}/boot/index.js`
if (os.platform() === 'win32') bootFile = 'file:///' + bootFile
const bajo = await import(bootFile)
const scope = await bajo.default()
// do whatever necessary to scope
