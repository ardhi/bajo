import fs from 'fs-extra'

function getPluginDataDir (name, ensureDir = true) {
  const { getPlugin } = this.app.bajo.helper
  const plugin = getPlugin(name)
  const dir = `${this.app.bajo.config.dir.data}/plugins/${plugin.config.name}`
  if (ensureDir) fs.ensureDirSync(dir)
  return dir
}

export default getPluginDataDir
