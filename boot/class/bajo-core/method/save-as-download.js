import fs from 'fs-extra'
import path from 'path'
import lodash from 'lodash'
import increment from 'add-filename-increment'

const { trim } = lodash

async function saveAsDownload (file, obj, printSaved = true) {
  const { print, getPluginDataDir } = this.app.bajo
  const plugin = this.name
  const fname = increment(`${getPluginDataDir(plugin)}/${trim(file, '/')}`, { fs: true })
  const dir = path.dirname(fname)
  if (!fs.existsSync(dir)) fs.ensureDirSync(dir)
  await fs.writeFile(fname, obj, 'utf8')
  if (printSaved) print.succeed('savedAs%s', path.resolve(fname), { skipSilence: true })
  return fname
}

export default saveAsDownload
