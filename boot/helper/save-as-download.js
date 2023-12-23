import fs from 'fs-extra'
import path from 'path'
import { trim } from 'lodash-es'
import increment from 'add-filename-increment'

async function saveAsDownload (file, obj, printSaved = true) {
  const { print, getPluginName, getPluginDataDir } = this.bajo.helper
  const plugin = getPluginName(4)
  const fname = increment(`${getPluginDataDir(plugin)}/${trim(file, '/')}`, { fs: true })
  const dir = path.dirname(fname)
  if (!fs.existsSync(dir)) fs.ensureDirSync(dir)
  await fs.writeFile(fname, obj, 'utf8')
  if (printSaved) print.succeed('Saved as \'%s\'', path.resolve(fname), { skipSilence: true })
  return fname
}

export default saveAsDownload
