import fs from 'fs-extra'
import resolvePath from './resolve-path.js'

const isValidApp = (dir) => {
  if (!dir) dir = process.env.BAJOCWD
  dir = resolvePath(dir)
  const hasAppDir = fs.existsSync(`${dir}/app/bajo`)
  const hasPackageJson = fs.existsSync(`${dir}/package.json`)
  return hasAppDir && hasPackageJson
}

export default isValidApp
