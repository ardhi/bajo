import fs from 'fs-extra'

async function saveAsDownload (file, obj, bajo) {
  const config = this.bajo.config
  let dir = `${config.dir.data}/download${bajo ? `/${bajo}` : ''}`
  await fs.ensureDir(dir)
  file = `${dir}${file}`
  await fs.writeFile(file, obj, 'utf8')
  return file
}

export default saveAsDownload
