import fs from 'fs-extra'
import path from 'path'

async function saveAsDownload (file, obj, bajo) {
  const config = this.bajo.config
  const fname = `${config.dir.data}/download${bajo ? `/${bajo}` : ''}${file}`
  const dir = path.dirname(fname)
  await fs.ensureDir(dir)
  await fs.writeFile(fname, obj, 'utf8')
  return fname
}

export default saveAsDownload
