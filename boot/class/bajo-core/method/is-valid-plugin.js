import fs from 'fs-extra'
import resolvePath from './resolve-path.js'

const isValidPlugin = (dir) => {
  if (!dir) dir = process.env.BAJOCWD
  dir = resolvePath(dir)
  const hasPluginDir = fs.existsSync(`${dir}/plugin`)
  const hasPackageJson = fs.existsSync(`${dir}/package.json`)
  return hasPluginDir && hasPackageJson
}

export default isValidPlugin
