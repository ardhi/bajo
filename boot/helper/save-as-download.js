import fs from 'fs-extra'
import path from 'path'
import { trim } from 'lodash-es'
import increment from 'add-filename-increment'

async function saveAsDownload (file, obj, printSaved = true) {
  const { print, getPluginName, resolvePath } = this.bajo.helper
  const config = this.bajo.config
  const plugin = getPluginName(4)
  const fname = resolvePath(increment(`${config.dir.data}/plugins/${plugin}/${trim(file, '/')}`, { fs: true }))
  const dir = path.dirname(fname)
  if (!fs.existsSync(dir)) fs.ensureDirSync(dir)
  await fs.writeFile(fname, obj, 'utf8')
  if (printSaved) print.bora('Saved as \'%s\'', path.resolve(fname), { skipSilence: true }).succeed()
  return fname
}

export default saveAsDownload
