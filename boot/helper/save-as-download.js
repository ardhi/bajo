import fs from 'fs-extra'
import path from 'path'

async function saveAsDownload (file, obj, bajo, printSaved = true) {
  const { print } = this.bajo.helper
  const config = this.bajo.config
  const fname = `${config.dir.data}/download${bajo ? `/${bajo}` : ''}${file}`
  const dir = path.dirname(fname)
  await fs.ensureDir(dir)
  await fs.writeFile(fname, obj, 'utf8')
  if (printSaved) print.bora('Saved as \'%s\'', fname, { skipSilence: true }).succeed()
  return fname
}

export default saveAsDownload
