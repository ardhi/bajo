import fs from 'fs-extra'
import pathResolve from './path-resolve.js'

const isValidPlugin = (dir) => {
  if (!dir) dir = process.cwd()
  dir = pathResolve(dir)
  const hasBajoDir = fs.existsSync(`${dir}/bajo`)
  const hasPackageJson = fs.existsSync(`${dir}/package.json`)
  return hasBajoDir && hasPackageJson
}

export default isValidPlugin
