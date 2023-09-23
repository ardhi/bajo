import fs from 'fs-extra'

function getPluginDataDir (name, ensureDir = true) {
  const { getPlugin, getConfig } = this.bajo.helper
  const plugin = getPlugin(name)
  const cfg = getConfig()
  const dir = `${cfg.dir.data}/plugins/${plugin.config.name}`
  if (ensureDir) fs.ensureDirSync(dir)
  return dir
}

export default getPluginDataDir
