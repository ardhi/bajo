import fs from 'fs-extra'

function getPluginDataDir (name, ensureDir = true) {
  const { getPlugin } = this.app.bajo
  const plugin = getPlugin(name)
  const dir = `${this.app.bajo.dir.data}/plugins/${plugin.name}`
  if (ensureDir) fs.ensureDirSync(dir)
  return dir
}

export default getPluginDataDir
