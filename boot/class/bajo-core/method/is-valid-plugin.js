import fs from 'fs-extra'
import resolvePath from './resolve-path.js'

const isValidPlugin = (dir) => {
  if (!dir) dir = process.env.BAJOCWD
  dir = resolvePath(dir)
  const hasBajoDir = fs.existsSync(`${dir}/bajo`)
  const hasPackageJson = fs.existsSync(`${dir}/package.json`)
  return hasBajoDir && hasPackageJson
}

export default isValidPlugin
