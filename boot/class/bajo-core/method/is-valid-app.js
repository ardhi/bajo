import fs from 'fs-extra'
import resolvePath from './resolve-path.js'

const isValidApp = (dir) => {
  if (!dir) dir = process.env.BAJOCWD
  dir = resolvePath(dir)
  const hasMainDir = fs.existsSync(`${dir}/main/plugin`)
  const hasPackageJson = fs.existsSync(`${dir}/package.json`)
  return hasMainDir && hasPackageJson
}

export default isValidApp
